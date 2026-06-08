package com.twalike.data.api.dto

import com.twalike.domain.model.Symbol
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ExchangeInfoDto(
    val symbols: List<SymbolInfoDto>,
)

@Serializable
data class SymbolInfoDto(
    @SerialName("symbol") val symbol: String,
    @SerialName("baseAsset") val baseAsset: String,
    @SerialName("quoteAsset") val quoteAsset: String,
    @SerialName("status") val status: String,
) {
    fun toDomain() = Symbol(
        name = symbol,
        baseAsset = baseAsset,
        quoteAsset = quoteAsset,
    )
}
