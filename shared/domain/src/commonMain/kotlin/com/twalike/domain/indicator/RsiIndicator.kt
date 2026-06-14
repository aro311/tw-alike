package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorPane
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.IndicatorSeries
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.KlineWindow

class RsiIndicator : Indicator {
    override val defaultParams = DEFAULT_PARAMS
    override fun compute(window: KlineWindow, config: IndicatorConfig): IndicatorResult {
        val period = config.params["period"]?.toIntOrNull() ?: 14
        val closes = window.klines.map { it.close }
        val values = mutableListOf<Double?>()

        if (closes.size <= period) {
            repeat(closes.size) { values.add(null) }
            return result(values)
        }

        val changes = closes.zipWithNext { a, b -> b - a }
        var avgGain = changes.take(period).filter { it > 0 }.sum() / period
        var avgLoss = changes.take(period).filter { it < 0 }.sumOf { -it } / period

        repeat(period) { values.add(null) }
        values.add(rsi(avgGain, avgLoss))

        changes.drop(period).forEach { change ->
            val gain = if (change > 0) change else 0.0
            val loss = if (change < 0) -change else 0.0
            avgGain = (avgGain * (period - 1) + gain) / period
            avgLoss = (avgLoss * (period - 1) + loss) / period
            values.add(rsi(avgGain, avgLoss))
        }

        return result(values)
    }

    private fun rsi(avgGain: Double, avgLoss: Double): Double =
        if (avgLoss == 0.0) 100.0 else 100.0 - (100.0 / (1.0 + avgGain / avgLoss))

    private fun result(values: List<Double?>) = IndicatorResult(
        type = IndicatorType.RSI,
        pane = IndicatorPane.SUB_PANE,
        series = listOf(IndicatorSeries("RSI", values)),
    )

    companion object {
        val DEFAULT_PARAMS = mapOf("period" to "14", "overbought" to "70", "oversold" to "30")
    }
}
