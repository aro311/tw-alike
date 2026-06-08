package com.twalike.data.api.dto

import com.twalike.domain.model.Kline
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

// Binance kline REST response: array of arrays
// [openTime, open, high, low, close, volume, closeTime, ...]
@Serializable
data class KlineArrayDto(val raw: JsonArray) {
    fun toDomain(): Kline = Kline(
        openTime = raw[0].jsonPrimitive.long,
        open = raw[1].jsonPrimitive.double,
        high = raw[2].jsonPrimitive.double,
        low = raw[3].jsonPrimitive.double,
        close = raw[4].jsonPrimitive.double,
        volume = raw[5].jsonPrimitive.double,
        closeTime = raw[6].jsonPrimitive.long,
    )
}
