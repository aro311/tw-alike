package com.twalike.domain.model

data class Ticker(
    val symbol: String,
    val lastPrice: Double,
    val priceChange: Double,
    val priceChangePercent: Double,
    val volume: Double,
)
