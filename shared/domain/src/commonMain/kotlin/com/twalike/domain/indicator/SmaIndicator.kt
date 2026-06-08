package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorPane
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorSeries
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.KlineWindow

class SmaIndicator : Indicator {
    override fun compute(window: KlineWindow, config: IndicatorConfig): IndicatorResult {
        val period = config.params["period"]?.toIntOrNull() ?: 20
        val closes = window.klines.map { it.close }
        val values: List<Double?> = closes.indices.map { i ->
            if (i < period - 1) null
            else closes.subList(i - period + 1, i + 1).average()
        }
        return IndicatorResult(
            type = IndicatorType.SMA,
            pane = IndicatorPane.OVERLAY,
            series = listOf(IndicatorSeries("SMA($period)", values)),
        )
    }

    companion object {
        val DEFAULT_PARAMS = mapOf("period" to "20")
    }
}
