package com.twalike.domain.model

enum class IndicatorType {
    SMA, EMA, BOLLINGER_BANDS, VOLUME, RSI, MACD
}

enum class IndicatorPane { OVERLAY, SUB_PANE }

data class IndicatorSeries(
    val name: String,
    val values: List<Double?>,
)

data class IndicatorResult(
    val type: IndicatorType,
    val pane: IndicatorPane,
    val series: List<IndicatorSeries>,
)

data class IndicatorConfig(
    val symbol: String,
    val type: IndicatorType,
    val isVisible: Boolean,
    val params: Map<String, String>,
)
