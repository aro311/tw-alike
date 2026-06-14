package com.twalike.domain.indicator

internal fun computeEmaValues(values: List<Double>, period: Int): List<Double?> {
    if (values.size < period) return List(values.size) { null }
    val k = 2.0 / (period + 1)
    var ema: Double? = null
    return values.mapIndexed { i, v ->
        ema = when {
            i == period - 1 -> values.take(period).average()
            i >= period -> v * k + ema!! * (1 - k)
            else -> null
        }
        if (i < period - 1) null else ema
    }
}
