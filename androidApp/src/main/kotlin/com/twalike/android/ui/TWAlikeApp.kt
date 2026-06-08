package com.twalike.android.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.twalike.android.ui.chart.ChartScreen
import com.twalike.android.ui.settings.SettingsScreen
import com.twalike.android.ui.theme.TWAlikeTheme
import com.twalike.android.ui.watchlist.WatchlistScreen

sealed class Screen(val route: String) {
    data object Watchlist : Screen("watchlist")
    data object Chart : Screen("chart/{symbol}") {
        fun createRoute(symbol: String) = "chart/$symbol"
    }
    data object Settings : Screen("settings")
}

@Composable
fun TWAlikeApp() {
    val navController = rememberNavController()

    TWAlikeTheme {
        Scaffold(
            bottomBar = {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                val showBottomBar = currentDestination?.route != Screen.Chart.route

                if (showBottomBar) {
                    NavigationBar {
                        NavigationBarItem(
                            selected = currentDestination?.hierarchy?.any { it.route == Screen.Watchlist.route } == true,
                            onClick = {
                                navController.navigate(Screen.Watchlist.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Text("📋") },
                            label = { Text("Watchlist") },
                        )
                        NavigationBarItem(
                            selected = currentDestination?.hierarchy?.any { it.route == Screen.Settings.route } == true,
                            onClick = {
                                navController.navigate(Screen.Settings.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Text("⚙️") },
                            label = { Text("Settings") },
                        )
                    }
                }
            }
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = Screen.Watchlist.route,
                modifier = Modifier.padding(innerPadding),
            ) {
                composable(Screen.Watchlist.route) {
                    WatchlistScreen(onSymbolClick = { symbol ->
                        navController.navigate(Screen.Chart.createRoute(symbol))
                    })
                }
                composable(Screen.Chart.route) { backStackEntry ->
                    val symbol = backStackEntry.arguments?.getString("symbol") ?: return@composable
                    ChartScreen(symbol = symbol, onBack = { navController.popBackStack() })
                }
                composable(Screen.Settings.route) {
                    SettingsScreen()
                }
            }
        }
    }
}
