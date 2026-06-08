package com.twalike.android.ui.watchlist

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val symbolColors = listOf(
    Color(0xFFF7931A), Color(0xFF627EEA), Color(0xFF00D4AA),
    Color(0xFFF3BA2F), Color(0xFF9945FF), Color(0xFF2775CA),
)

@Composable
fun CoinIconPlaceholder(symbol: String, modifier: Modifier = Modifier) {
    val baseAsset = symbol.removeSuffix("USDT").removeSuffix("BTC").removeSuffix("ETH")
    val color = symbolColors[symbol.hashCode().mod(symbolColors.size).let { if (it < 0) it + symbolColors.size else it }]
    Box(
        modifier = modifier.clip(CircleShape).background(color),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = baseAsset.take(3),
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp,
        )
    }
}
