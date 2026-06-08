package com.twalike.domain.model

enum class DrawingType { HORIZONTAL_LINE, TREND_LINE, FIBONACCI }

data class DrawingPoint(val time: Long, val price: Double)

data class Drawing(
    val id: String,
    val symbol: String,
    val type: DrawingType,
    val points: List<DrawingPoint>,
)
