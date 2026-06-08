package com.twalike.presentation.settings

import com.twalike.domain.model.FavoriteInterval
import com.twalike.domain.model.Interval
import com.twalike.domain.repository.SettingsRepository
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

data class SettingsState(
    val favoriteIntervals: List<FavoriteInterval> = emptyList(),
    val allIntervals: List<Interval> = Interval.entries,
)

class SettingsViewModel(private val settingsRepository: SettingsRepository) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val _state = MutableStateFlow(SettingsState())
    val state: StateFlow<SettingsState> = _state

    init {
        settingsRepository.observeFavoriteIntervals()
            .onEach { favorites -> _state.update { it.copy(favoriteIntervals = favorites) } }
            .catch {}
            .launchIn(scope)
    }

    fun addFavorite(interval: Interval) {
        scope.launch { settingsRepository.addFavoriteInterval(interval) }
    }

    fun removeFavorite(interval: Interval) {
        scope.launch { settingsRepository.removeFavoriteInterval(interval) }
    }
}
