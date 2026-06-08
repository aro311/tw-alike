package com.twalike.presentation.watchlist

import com.twalike.domain.model.Ticker
import com.twalike.domain.model.WatchlistEntry
import com.twalike.domain.repository.WatchlistRepository
import com.twalike.domain.usecase.ObserveWatchlistUseCase
import com.twalike.domain.usecase.WatchlistItem
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WatchlistState(
    val items: List<WatchlistItem> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
)

class WatchlistViewModel(
    private val observeWatchlistUseCase: ObserveWatchlistUseCase,
    private val watchlistRepository: WatchlistRepository,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val _state = MutableStateFlow(WatchlistState())
    val state: StateFlow<WatchlistState> = _state

    init {
        observeWatchlistUseCase.execute()
            .onEach { items -> _state.update { it.copy(items = items, isLoading = false) } }
            .catch { e -> _state.update { it.copy(error = e.message, isLoading = false) } }
            .launchIn(scope)
    }

    fun removeEntry(symbol: String) {
        scope.launch { watchlistRepository.removeEntry(symbol) }
    }

    fun reorderEntries(symbols: List<String>) {
        scope.launch { watchlistRepository.reorderEntries(symbols) }
    }
}
