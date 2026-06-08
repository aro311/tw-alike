package com.twalike.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF2196F3),
    secondary = Color(0xFF4CAF50),
    error = Color(0xFFF44336),
    background = Color(0xFF131722),
    surface = Color(0xFF1E2435),
    onBackground = Color(0xFFD1D4DC),
    onSurface = Color(0xFFD1D4DC),
)

@Composable
fun TWAlikeTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = DarkColorScheme, content = content)
}
