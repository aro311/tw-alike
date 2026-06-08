package com.twalike.android.ui.chart

import kotlinx.serialization.Serializable

@Serializable
data class ChartBridgePayload(
    val klines: List<KlineJson>,
    val indicators: List<IndicatorJson>,
)

@Serializable
data class KlineJson(
    val time: Long,
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double,
    val volume: Double,
)

@Serializable
data class IndicatorJson(
    val type: String,
    val pane: String,
    val series: List<SeriesJson>,
)

@Serializable
data class SeriesJson(
    val name: String,
    val values: List<Double?>,
)
