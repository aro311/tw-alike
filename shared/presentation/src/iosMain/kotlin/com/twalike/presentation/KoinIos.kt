package com.twalike.presentation

import com.twalike.data.DatabaseDriverFactory
import com.twalike.data.db.TWAlikeDatabase
import com.twalike.data.di.dataModule
import com.twalike.presentation.chart.ChartViewModel
import com.twalike.presentation.di.presentationModule
import com.twalike.presentation.search.CoinSearchViewModel
import com.twalike.presentation.settings.SettingsViewModel
import com.twalike.presentation.watchlist.WatchlistViewModel
import org.koin.core.context.startKoin
import org.koin.core.parameter.parametersOf
import org.koin.mp.KoinPlatform
import org.koin.dsl.module

fun initKoin() {
    startKoin {
        modules(
            module {
                single { DatabaseDriverFactory().create() }
                single { TWAlikeDatabase(get()) }
            },
            dataModule,
            presentationModule,
        )
    }
}

fun resolveWatchlistViewModel(): WatchlistViewModel = KoinPlatform.getKoin().get()
fun resolveCoinSearchViewModel(): CoinSearchViewModel = KoinPlatform.getKoin().get()
fun resolveSettingsViewModel(): SettingsViewModel = KoinPlatform.getKoin().get()
fun resolveChartViewModel(symbol: String): ChartViewModel =
    KoinPlatform.getKoin().get(parameters = { parametersOf(symbol) })
