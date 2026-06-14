package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorPane
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorSeries
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.KlineWindow

class VolumeIndicator : Indicator {
    override val defaultParams = DEFAULT_PARAMS
    override fun compute(window: KlineWindow, config: IndicatorConfig): IndicatorResult {
        val values = window.klines.map { it.volume as Double? }
        return IndicatorResult(
            type = IndicatorType.VOLUME,
            pane = IndicatorPane.SUB_PANE,
            series = listOf(IndicatorSeries("Volume", values)),
        )
    }

    companion object {
        val DEFAULT_PARAMS = emptyMap<String, String>()
    }
}
