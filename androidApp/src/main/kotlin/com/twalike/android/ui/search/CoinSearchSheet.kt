package com.twalike.android.ui.search

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.twalike.presentation.search.CoinSearchViewModel
import org.koin.compose.koinInject

@Composable
fun CoinSearchSheet(
    onDismiss: () -> Unit,
    viewModel: CoinSearchViewModel = koinInject(),
) {
    val state by viewModel.state.collectAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        OutlinedTextField(
            value = state.query,
            onValueChange = viewModel::updateQuery,
            placeholder = { Text("Search symbol, e.g. BTC") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        LazyColumn {
            items(state.results, key = { it.name }) { symbol ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            viewModel.addToWatchlist(symbol.name)
                            onDismiss()
                        }
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(symbol.name, modifier = Modifier.weight(1f))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("${symbol.baseAsset} / ${symbol.quoteAsset}")
                }
            }
        }
    }
}
