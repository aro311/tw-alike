package com.twalike.data.api.dto

import com.twalike.domain.model.Ticker
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Binance !miniTicker@arr WebSocket stream entry
@Serializable
data class MiniTickerDto(
    @SerialName("s") val symbol: String,
    @SerialName("c") val lastPrice: String,
    @SerialName("P") val priceChangePercent: String,
    @SerialName("p") val priceChange: String,
    @SerialName("v") val volume: String,
) {
    fun toDomain() = Ticker(
        symbol = symbol,
        lastPrice = lastPrice.toDoubleOrNull() ?: 0.0,
        priceChange = priceChange.toDoubleOrNull() ?: 0.0,
        priceChangePercent = priceChangePercent.toDoubleOrNull() ?: 0.0,
        volume = volume.toDoubleOrNull() ?: 0.0,
    )
}

@Serializable
data class MiniTickerStreamDto(
    val data: List<MiniTickerDto>,
)
