package com.twalike.domain.model

data class WatchlistEntry(
    val symbol: String,
    val displayOrder: Int,
    val lastInterval: Interval,
)
