package com.twalike.presentation.search

import com.twalike.domain.model.Symbol
import com.twalike.domain.repository.MarketRepository
import com.twalike.domain.repository.WatchlistRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CoinSearchState(
    val query: String = "",
    val results: List<Symbol> = emptyList(),
    val isLoading: Boolean = false,
)

@OptIn(FlowPreview::class)
class CoinSearchViewModel(
    private val marketRepository: MarketRepository,
    private val watchlistRepository: WatchlistRepository,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val _state = MutableStateFlow(CoinSearchState())
    val state: StateFlow<CoinSearchState> = _state

    private val queryFlow = MutableStateFlow("")

    init {
        queryFlow
            .debounce(300)
            .onEach { query -> search(query) }
            .launchIn(scope)
    }

    fun updateQuery(query: String) {
        _state.update { it.copy(query = query) }
        queryFlow.value = query
    }

    fun addToWatchlist(symbol: String) {
        scope.launch { watchlistRepository.addEntry(symbol) }
    }

    private fun search(query: String) {
        scope.launch {
            _state.update { it.copy(isLoading = true) }
            runCatching {
                if (query.isBlank()) marketRepository.getSymbolCatalog().take(20)
                else marketRepository.searchSymbols(query)
            }
                .onSuccess { results -> _state.update { it.copy(results = results, isLoading = false) } }
                .onFailure { _state.update { it.copy(isLoading = false) } }
        }
    }
}
