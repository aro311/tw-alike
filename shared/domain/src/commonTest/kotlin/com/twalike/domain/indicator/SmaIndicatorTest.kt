package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.model.Interval
import com.twalike.domain.model.Kline
import com.twalike.domain.model.KlineWindow
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class SmaIndicatorTest {
    private val indicator = SmaIndicator()

    private fun window(closes: List<Double>): KlineWindow {
        val klines = closes.mapIndexed { i, close ->
            Kline(i.toLong(), close, close, close, close, 0.0, i.toLong())
        }
        return KlineWindow("BTCUSDT", Interval.ONE_DAY, klines, 0L)
    }

    private fun config(period: Int) = IndicatorConfig(
        symbol = "BTCUSDT",
        type = IndicatorType.SMA,
        isVisible = true,
        params = mapOf("period" to period.toString()),
    )

    @Test
    fun firstPeriodMinusOneValuesAreNull() {
        val result = indicator.compute(window(listOf(1.0, 2.0, 3.0, 4.0, 5.0)), config(3))
        assertNull(result.series.first().values[0])
        assertNull(result.series.first().values[1])
    }

    @Test
    fun smaValueIsCorrectAtPeriodBoundary() {
        val result = indicator.compute(window(listOf(1.0, 2.0, 3.0, 4.0, 5.0)), config(3))
        assertEquals(2.0, result.series.first().values[2])
    }

    @Test
    fun smaRollsCorrectly() {
        val result = indicator.compute(window(listOf(1.0, 2.0, 3.0, 4.0, 5.0)), config(3))
        assertEquals(4.0, result.series.first().values[4])
    }

    @Test
    fun smaWithPeriodLargerThanWindowReturnsAllNulls() {
        val result = indicator.compute(window(listOf(1.0, 2.0)), config(5))
        result.series.first().values.forEach { assertNull(it) }
    }
}
