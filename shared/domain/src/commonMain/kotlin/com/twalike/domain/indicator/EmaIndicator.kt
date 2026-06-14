package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorPane
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorSeries
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.KlineWindow

class EmaIndicator : Indicator {
    override val defaultParams = DEFAULT_PARAMS

    override fun compute(window: KlineWindow, config: IndicatorConfig): IndicatorResult {
        val period = config.params["period"]?.toIntOrNull() ?: 20
        val closes = window.klines.map { it.close }
        val values = computeEmaValues(closes, period)
        return IndicatorResult(
            type = IndicatorType.EMA,
            pane = IndicatorPane.OVERLAY,
            series = listOf(IndicatorSeries("EMA($period)", values)),
        )
    }

    companion object {
        val DEFAULT_PARAMS = mapOf("period" to "20")
    }
}
