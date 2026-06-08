package com.twalike.presentation.di

import com.twalike.domain.usecase.ComputeIndicatorsUseCase
import com.twalike.domain.usecase.ObserveWatchlistUseCase
import com.twalike.presentation.chart.ChartViewModel
import com.twalike.presentation.search.CoinSearchViewModel
import com.twalike.presentation.settings.SettingsViewModel
import com.twalike.presentation.watchlist.WatchlistViewModel
import org.koin.core.parameter.parametersOf
import org.koin.dsl.module

val presentationModule = module {
    single { ComputeIndicatorsUseCase() }
    single { ObserveWatchlistUseCase(get(), get()) }

    factory { WatchlistViewModel(get(), get()) }
    factory { SettingsViewModel(get()) }
    factory { CoinSearchViewModel(get(), get()) }
    factory { (symbol: String) ->
        ChartViewModel(symbol, get(), get(), get(), get(), get())
    }
}
