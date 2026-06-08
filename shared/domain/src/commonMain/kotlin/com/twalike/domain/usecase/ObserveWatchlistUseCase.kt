package com.twalike.domain.usecase

import com.twalike.domain.model.Ticker
import com.twalike.domain.model.WatchlistEntry
import com.twalike.domain.repository.MarketRepository
import com.twalike.domain.repository.WatchlistRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.onStart

data class WatchlistItem(
    val entry: WatchlistEntry,
    val ticker: Ticker?,
)

class ObserveWatchlistUseCase(
    private val watchlistRepository: WatchlistRepository,
    private val marketRepository: MarketRepository,
) {
    fun execute(): Flow<List<WatchlistItem>> =
        combine(
            watchlistRepository.observeWatchlist(),
            marketRepository.observeTickers().onStart { emit(emptyList()) },
        ) { entries, tickers ->
            val tickerMap = tickers.associateBy { it.symbol }
            entries
                .sortedBy { it.displayOrder }
                .map { entry -> WatchlistItem(entry, tickerMap[entry.symbol]) }
        }
}
