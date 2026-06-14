package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorPane
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorSeries
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.KlineWindow
import kotlin.math.sqrt

class BollingerBandsIndicator : Indicator {
    override val defaultParams = DEFAULT_PARAMS
    override fun compute(window: KlineWindow, config: IndicatorConfig): IndicatorResult {
        val period = config.params["period"]?.toIntOrNull() ?: 20
        val stdDevMultiplier = config.params["stdDev"]?.toDoubleOrNull() ?: 2.0
        val closes = window.klines.map { it.close }

        val middle = mutableListOf<Double?>()
        val upper = mutableListOf<Double?>()
        val lower = mutableListOf<Double?>()

        closes.indices.forEach { i ->
            if (i < period - 1) {
                middle.add(null); upper.add(null); lower.add(null)
            } else {
                val slice = closes.subList(i - period + 1, i + 1)
                val sma = slice.average()
                val stdDev = sqrt(slice.sumOf { (it - sma) * (it - sma) } / period)
                middle.add(sma)
                upper.add(sma + stdDevMultiplier * stdDev)
                lower.add(sma - stdDevMultiplier * stdDev)
            }
        }

        return IndicatorResult(
            type = IndicatorType.BOLLINGER_BANDS,
            pane = IndicatorPane.OVERLAY,
            series = listOf(
                IndicatorSeries("BB_MIDDLE", middle),
                IndicatorSeries("BB_UPPER", upper),
                IndicatorSeries("BB_LOWER", lower),
            ),
        )
    }

    companion object {
        val DEFAULT_PARAMS = mapOf("period" to "20", "stdDev" to "2.0")
    }
}
