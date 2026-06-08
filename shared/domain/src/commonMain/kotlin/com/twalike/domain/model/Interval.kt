package com.twalike.domain.model

enum class Interval(val value: String, val displayLabel: String) {
    ONE_MINUTE("1m", "1m"),
    THREE_MINUTES("3m", "3m"),
    FIVE_MINUTES("5m", "5m"),
    FIFTEEN_MINUTES("15m", "15m"),
    THIRTY_MINUTES("30m", "30m"),
    ONE_HOUR("1h", "1H"),
    TWO_HOURS("2h", "2H"),
    FOUR_HOURS("4h", "4H"),
    SIX_HOURS("6h", "6H"),
    EIGHT_HOURS("8h", "8H"),
    TWELVE_HOURS("12h", "12H"),
    ONE_DAY("1d", "1D"),
    THREE_DAYS("3d", "3D"),
    ONE_WEEK("1w", "1W"),
    ONE_MONTH("1M", "1M");

    companion object {
        fun fromValue(value: String): Interval =
            entries.firstOrNull { it.value == value } ?: ONE_DAY
    }
}
