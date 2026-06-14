package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorPane
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorSeries
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.KlineWindow

class MacdIndicator : Indicator {
    override val defaultParams = DEFAULT_PARAMS

    override fun compute(window: KlineWindow, config: IndicatorConfig): IndicatorResult {
        val fastPeriod = config.params["fast"]?.toIntOrNull() ?: 12
        val slowPeriod = config.params["slow"]?.toIntOrNull() ?: 26
        val signalPeriod = config.params["signal"]?.toIntOrNull() ?: 9
        val closes = window.klines.map { it.close }

        val fastEma = computeEmaValues(closes, fastPeriod)
        val slowEma = computeEmaValues(closes, slowPeriod)

        val macdLine = closes.indices.map { i ->
            val f = fastEma[i]; val s = slowEma[i]
            if (f != null && s != null) f - s else null
        }

        val macdValues = macdLine.filterNotNull()
        val signalValues = computeEmaValues(macdValues, signalPeriod)
        val signalOffset = macdLine.indexOfFirst { it != null }

        val signal = MutableList<Double?>(closes.size) { null }
        signalValues.forEachIndexed { i, v -> signal[signalOffset + i] = v }

        val histogram = closes.indices.map { i ->
            val m = macdLine[i]; val s = signal[i]
            if (m != null && s != null) m - s else null
        }

        return IndicatorResult(
            type = IndicatorType.MACD,
            pane = IndicatorPane.SUB_PANE,
            series = listOf(
                IndicatorSeries("MACD", macdLine),
                IndicatorSeries("Signal", signal),
                IndicatorSeries("Histogram", histogram),
            ),
        )
    }

    companion object {
        val DEFAULT_PARAMS = mapOf("fast" to "12", "slow" to "26", "signal" to "9")
    }
}
