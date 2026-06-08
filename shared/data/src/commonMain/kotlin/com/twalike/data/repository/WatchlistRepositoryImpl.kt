package com.twalike.data.repository

import com.twalike.data.db.TWAlikeDatabase
import com.twalike.domain.model.Interval
import com.twalike.domain.model.WatchlistEntry
import com.twalike.domain.repository.WatchlistRepository
import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class WatchlistRepositoryImpl(private val db: TWAlikeDatabase) : WatchlistRepository {

    override fun observeWatchlist(): Flow<List<WatchlistEntry>> =
        db.tWAlikeDatabaseQueries.selectAllWatchlistEntries()
            .asFlow()
            .mapToList(Dispatchers.Default)
            .map { rows -> rows.map { WatchlistEntry(it.symbol, it.display_order.toInt(), Interval.fromValue(it.last_interval)) } }

    override suspend fun addEntry(symbol: String): Unit = withContext(Dispatchers.Default) {
        val maxOrder = db.tWAlikeDatabaseQueries.selectAllWatchlistEntries().executeAsList()
            .maxOfOrNull { it.display_order }?.toInt() ?: -1
        db.tWAlikeDatabaseQueries.insertWatchlistEntry(symbol, (maxOrder + 1).toLong(), Interval.ONE_DAY.value)
    }

    override suspend fun removeEntry(symbol: String): Unit = withContext(Dispatchers.Default) {
        db.tWAlikeDatabaseQueries.deleteWatchlistEntry(symbol)
    }

    override suspend fun reorderEntries(symbols: List<String>): Unit = withContext(Dispatchers.Default) {
        db.transaction {
            symbols.forEachIndexed { index, symbol ->
                db.tWAlikeDatabaseQueries.updateWatchlistOrder(index.toLong(), symbol)
            }
        }
    }

    override suspend fun updateLastInterval(symbol: String, interval: Interval): Unit = withContext(Dispatchers.Default) {
        db.tWAlikeDatabaseQueries.updateWatchlistInterval(interval.value, symbol)
    }
}
