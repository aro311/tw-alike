package com.twalike.android.ui.watchlist

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.twalike.android.ui.search.CoinSearchSheet
import com.twalike.domain.usecase.WatchlistItem
import com.twalike.presentation.watchlist.WatchlistViewModel
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WatchlistScreen(
    onSymbolClick: (String) -> Unit,
    viewModel: WatchlistViewModel = koinInject(),
) {
    val state by viewModel.state.collectAsState()
    var showSearch by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("TWAlike", fontWeight = FontWeight.Bold) },
            actions = {
                IconButton(onClick = { showSearch = true }) {
                    Icon(Icons.Default.Add, contentDescription = "Add symbol")
                }
            }
        )

        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(state.items, key = { it.entry.symbol }) { item ->
                WatchlistRow(item = item, onClick = { onSymbolClick(item.entry.symbol) })
            }
        }
    }

    if (showSearch) {
        ModalBottomSheet(onDismissRequest = { showSearch = false }) {
            CoinSearchSheet(onDismiss = { showSearch = false })
        }
    }
}

@Composable
private fun WatchlistRow(item: WatchlistItem, onClick: () -> Unit) {
    val ticker = item.ticker
    val changeColor = when {
        (ticker?.priceChangePercent ?: 0.0) > 0 -> Color(0xFF26A69A)
        (ticker?.priceChangePercent ?: 0.0) < 0 -> Color(0xFFEF5350)
        else -> MaterialTheme.colorScheme.onSurface
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Coin icon placeholder
        CoinIconPlaceholder(symbol = item.entry.symbol, modifier = Modifier.size(40.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(item.entry.symbol, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyLarge)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                ticker?.lastPrice?.toString() ?: "--",
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.bodyLarge,
            )
            Text(
                ticker?.let { "${it.priceChangePercent.format(2)}%" } ?: "--",
                color = changeColor,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

private fun Double.format(decimals: Int) = "%.${decimals}f".format(this)
