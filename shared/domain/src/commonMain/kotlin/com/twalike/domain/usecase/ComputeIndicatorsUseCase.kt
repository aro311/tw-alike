package com.twalike.domain.usecase

import com.twalike.domain.indicator.BollingerBandsIndicator
import com.twalike.domain.indicator.EmaIndicator
import com.twalike.domain.indicator.Indicator
import com.twalike.domain.indicator.MacdIndicator
import com.twalike.domain.indicator.RsiIndicator
import com.twalike.domain.indicator.SmaIndicator
import com.twalike.domain.indicator.VolumeIndicator
import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.KlineWindow

val defaultIndicatorRegistry: Map<IndicatorType, Indicator> = mapOf(
    IndicatorType.SMA to SmaIndicator(),
    IndicatorType.EMA to EmaIndicator(),
    IndicatorType.BOLLINGER_BANDS to BollingerBandsIndicator(),
    IndicatorType.VOLUME to VolumeIndicator(),
    IndicatorType.RSI to RsiIndicator(),
    IndicatorType.MACD to MacdIndicator(),
)

class ComputeIndicatorsUseCase(
    private val registry: Map<IndicatorType, Indicator> = defaultIndicatorRegistry,
) {
    fun execute(window: KlineWindow, configs: List<IndicatorConfig>): List<IndicatorResult> =
        configs
            .filter { it.isVisible }
            .mapNotNull { config ->
                registry[config.type]?.compute(window, config)
            }
}
