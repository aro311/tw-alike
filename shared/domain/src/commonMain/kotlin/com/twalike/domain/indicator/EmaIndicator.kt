package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorPane
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorSeries
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.KlineWindow

class EmaIndicator : Indicator {
    override fun compute(window: KlineWindow, config: IndicatorConfig): IndicatorResult {
        val period = config.params["period"]?.toIntOrNull() ?: 20
        val closes = window.klines.map { it.close }
        val k = 2.0 / (period + 1)
        val values = mutableListOf<Double?>()
        var ema: Double? = null
        closes.forEachIndexed { i, close ->
            val prev = ema
            ema = if (prev == null && i >= period - 1) {
                closes.subList(0, period).average()
            } else if (prev != null) {
                close * k + prev * (1 - k)
            } else null
            values.add(if (i < period - 1) null else ema)
        }
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
