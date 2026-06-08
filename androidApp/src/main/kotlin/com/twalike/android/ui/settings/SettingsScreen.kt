package com.twalike.android.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.twalike.presentation.settings.SettingsViewModel
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(viewModel: SettingsViewModel = koinInject()) {
    val state by viewModel.state.collectAsState()
    val favoriteSet = state.favoriteIntervals.map { it.interval }.toSet()

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Settings") })

        Text(
            "Favorite Intervals",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        )
        Text(
            "Starred intervals appear at the top of the interval picker.",
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 8.dp),
        )

        FlowRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
        ) {
            state.allIntervals.forEach { interval ->
                val isFavorite = interval in favoriteSet
                FilterChip(
                    selected = isFavorite,
                    onClick = {
                        if (isFavorite) viewModel.removeFavorite(interval)
                        else viewModel.addFavorite(interval)
                    },
                    label = { Text(interval.displayLabel) },
                    modifier = Modifier.padding(end = 8.dp, bottom = 8.dp),
                )
            }
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
    }
}
