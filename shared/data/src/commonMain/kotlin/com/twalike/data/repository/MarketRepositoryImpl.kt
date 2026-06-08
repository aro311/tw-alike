package com.twalike.data.repository

import com.twalike.data.api.BinanceApiClient
import com.twalike.data.db.TWAlikeDatabase
import com.twalike.domain.model.Interval
import com.twalike.domain.model.Kline
import com.twalike.domain.model.KlineWindow
import com.twalike.domain.model.Symbol
import com.twalike.domain.model.Ticker
import com.twalike.domain.repository.MarketRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.shareIn
import kotlinx.coroutines.withContext
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

private const val CATALOG_TTL_MS = 24 * 60 * 60 * 1000L

class MarketRepositoryImpl(
    private val api: BinanceApiClient,
    private val db: TWAlikeDatabase,
) : MarketRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    // Single shared WebSocket connection for all ticker subscribers
    private val tickerFlow: Flow<List<Ticker>> = api.streamTickers()
        .map { dto -> dto.data.map { it.toDomain() } }
        .shareIn(scope, SharingStarted.WhileSubscribed(5_000), replay = 1)

    override fun observeTickers(): Flow<List<Ticker>> = tickerFlow

    override fun observeKlines(symbol: String, interval: Interval): Flow<Kline> =
        api.streamKline(symbol, interval)
            .shareIn(scope, SharingStarted.WhileSubscribed(5_000), replay = 1)

    override suspend fun getKlineWindow(symbol: String, interval: Interval): KlineWindow =
        withContext(Dispatchers.Default) {
            val cached = db.tWAlikeDatabaseQueries
                .selectKlineWindow(symbol, interval.value)
                .executeAsList()

            if (cached.isNotEmpty()) {
                val fetchedAt = cached.first().fetched_at
                val klines = cached.map {
                    Kline(it.open_time, it.open_price, it.high_price, it.low_price, it.close_price, it.volume, it.close_time)
                }
                return@withContext KlineWindow(symbol, interval, klines, fetchedAt)
            }

            fetchAndCacheKlines(symbol, interval)
        }

    private suspend fun fetchAndCacheKlines(symbol: String, interval: Interval): KlineWindow {
        val klines = api.fetchKlines(symbol, interval)
        @OptIn(ExperimentalTime::class) val now = Clock.System.now().toEpochMilliseconds()
        db.transaction {
            db.tWAlikeDatabaseQueries.deleteKlineWindow(symbol, interval.value)
            klines.forEach { k ->
                db.tWAlikeDatabaseQueries.insertKline(symbol, interval.value, k.openTime, k.open, k.high, k.low, k.close, k.volume, k.closeTime, now)
            }
        }
        return KlineWindow(symbol, interval, klines, now)
    }

    override suspend fun getSymbolCatalog(): List<Symbol> = withContext(Dispatchers.Default) {
        val count = db.tWAlikeDatabaseQueries.countSymbols().executeAsOne()
        if (count > 0) {
            return@withContext db.tWAlikeDatabaseQueries.selectAllSymbols().executeAsList()
                .map { Symbol(it.symbol, it.base_asset, it.quote_asset) }
        }
        refreshCatalog()
    }

    override suspend fun searchSymbols(query: String): List<Symbol> = withContext(Dispatchers.Default) {
        db.tWAlikeDatabaseQueries.searchSymbols(query, query).executeAsList()
            .map { Symbol(it.symbol, it.base_asset, it.quote_asset) }
    }

    private suspend fun refreshCatalog(): List<Symbol> {
        val info = api.fetchExchangeInfo()
        val symbols = info.symbols.filter { it.status == "TRADING" }.map { it.toDomain() }
        @OptIn(ExperimentalTime::class) val now = Clock.System.now().toEpochMilliseconds()
        db.transaction {
            symbols.forEach { s ->
                db.tWAlikeDatabaseQueries.insertSymbol(s.name, s.baseAsset, s.quoteAsset, now)
            }
        }
        return symbols
    }
}
