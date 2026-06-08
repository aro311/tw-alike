package com.twalike.presentation.chart

import com.twalike.domain.model.Drawing
import com.twalike.domain.model.DrawingPoint
import com.twalike.domain.model.DrawingType
import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.Interval
import com.twalike.domain.model.KlineWindow
import com.twalike.domain.repository.DrawingRepository
import com.twalike.domain.repository.IndicatorRepository
import com.twalike.domain.repository.MarketRepository
import com.twalike.domain.repository.WatchlistRepository
import com.twalike.domain.usecase.ComputeIndicatorsUseCase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChartState(
    val symbol: String = "",
    val interval: Interval = Interval.ONE_DAY,
    val klineWindow: KlineWindow? = null,
    val indicators: List<IndicatorResult> = emptyList(),
    val drawings: List<Drawing> = emptyList(),
    val isLoading: Boolean = true,
    val isStale: Boolean = false,
    val error: String? = null,
)

class ChartViewModel(
    private val symbol: String,
    private val marketRepository: MarketRepository,
    private val watchlistRepository: WatchlistRepository,
    private val indicatorRepository: IndicatorRepository,
    private val drawingRepository: DrawingRepository,
    private val computeIndicatorsUseCase: ComputeIndicatorsUseCase,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val _state = MutableStateFlow(ChartState(symbol = symbol))
    val state: StateFlow<ChartState> = _state

    init {
        loadKlineWindow(Interval.ONE_DAY)
        observeDrawings()
    }

    fun changeInterval(interval: Interval) {
        scope.launch {
            watchlistRepository.updateLastInterval(symbol, interval)
            loadKlineWindow(interval)
        }
    }

    fun toggleIndicator(type: IndicatorType, visible: Boolean) {
        scope.launch { indicatorRepository.setVisible(symbol, type, visible) }
    }

    fun addDrawing(type: DrawingType, points: List<DrawingPoint>) {
        scope.launch { drawingRepository.addDrawing(symbol, type, points) }
    }

    fun removeDrawing(id: String) {
        scope.launch { drawingRepository.removeDrawing(id) }
    }

    private fun loadKlineWindow(interval: Interval) {
        scope.launch {
            _state.update { it.copy(isLoading = true, interval = interval) }
            runCatching { marketRepository.getKlineWindow(symbol, interval) }
                .onSuccess { window ->
                    val configs = indicatorRepository.observeConfigs(symbol)
                    // Observe configs reactively to recompute indicators on change
                    combine(
                        kotlinx.coroutines.flow.flowOf(window),
                        indicatorRepository.observeConfigs(symbol),
                    ) { w, cfgs ->
                        val results = computeIndicatorsUseCase.execute(w, cfgs)
                        _state.update { it.copy(klineWindow = w, indicators = results, isLoading = false) }
                    }
                        .catch { e -> _state.update { it.copy(error = e.message, isLoading = false) } }
                        .launchIn(scope)

                    // Subscribe to live kline updates
                    marketRepository.observeKlines(symbol, interval)
                        .onEach { liveKline ->
                            _state.update { state ->
                                val current = state.klineWindow ?: return@update state
                                val updated = current.klines.toMutableList()
                                val lastIndex = updated.indexOfLast { it.openTime == liveKline.openTime }
                                if (lastIndex >= 0) updated[lastIndex] = liveKline else updated.add(liveKline)
                                val newWindow = current.copy(klines = updated)
                                state.copy(klineWindow = newWindow)
                            }
                        }
                        .catch {}
                        .launchIn(scope)
                }
                .onFailure { e ->
                    _state.update { it.copy(error = e.message, isLoading = false, isStale = it.klineWindow != null) }
                }
        }
    }

    private fun observeDrawings() {
        drawingRepository.observeDrawings(symbol)
            .onEach { drawings -> _state.update { it.copy(drawings = drawings) } }
            .catch {}
            .launchIn(scope)
    }
}
