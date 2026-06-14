package com.twalike.presentation

import app.cash.turbine.test
import com.twalike.domain.model.Interval
import com.twalike.domain.model.Ticker
import com.twalike.domain.model.WatchlistEntry
import com.twalike.domain.repository.MarketRepository
import com.twalike.domain.repository.WatchlistRepository
import com.twalike.domain.usecase.ObserveWatchlistUseCase
import com.twalike.presentation.watchlist.WatchlistViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

class WatchlistViewModelTest {

    // Hand-written fakes — no MockK needed for stateful flows
    private val watchlistFlow = MutableStateFlow(
        listOf(WatchlistEntry("BTCUSDT", 0, Interval.ONE_DAY))
    )
    private val tickerFlow = MutableStateFlow(
        listOf(Ticker("BTCUSDT", 65000.0, -500.0, -0.76, 1_200_000.0))
    )

    private val fakeWatchlistRepo = object : WatchlistRepository {
        override fun observeWatchlist(): Flow<List<WatchlistEntry>> = watchlistFlow
        override suspend fun addEntry(symbol: String) { }
        override suspend fun removeEntry(symbol: String) {
            watchlistFlow.value = watchlistFlow.value.filter { it.symbol != symbol }
        }
        override suspend fun reorderEntries(symbols: List<String>) { }
        override suspend fun updateLastInterval(symbol: String, interval: Interval) { }
    }

    private val fakeMarketRepo = object : MarketRepository {
        override fun observeTickers(): Flow<List<Ticker>> = tickerFlow
        override fun observeKlines(symbol: String, interval: Interval) = throw UnsupportedOperationException()
        override suspend fun getKlineWindow(symbol: String, interval: Interval) = throw UnsupportedOperationException()
        override suspend fun getSymbolCatalog() = emptyList<com.twalike.domain.model.Symbol>()
        override suspend fun searchSymbols(query: String) = emptyList<com.twalike.domain.model.Symbol>()
    }

    private fun viewModel(scope: CoroutineScope) = WatchlistViewModel(
        ObserveWatchlistUseCase(fakeWatchlistRepo, fakeMarketRepo),
        fakeWatchlistRepo,
        scope,
    )

    @Test
    fun emitsWatchlistItemsWithTickers() = runTest {
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler))
        viewModel(scope).state.test {
            val state = awaitItem()
            assertEquals(1, state.items.size)
            assertEquals("BTCUSDT", state.items[0].entry.symbol)
            assertEquals(65000.0, state.items[0].ticker?.lastPrice)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun reflectsRemovalFromWatchlist() = runTest {
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler))
        val vm = viewModel(scope)
        vm.state.test {
            awaitItem() // initial
            vm.removeEntry("BTCUSDT")
            val updated = awaitItem()
            assertEquals(0, updated.items.size)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun itemHasNoTickerWhenSymbolNotInStream() = runTest {
        tickerFlow.value = emptyList()
        val scope = CoroutineScope(UnconfinedTestDispatcher(testScheduler))
        viewModel(scope).state.test {
            val state = awaitItem()
            assertFalse(state.isLoading)
            assertEquals(null, state.items[0].ticker)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
