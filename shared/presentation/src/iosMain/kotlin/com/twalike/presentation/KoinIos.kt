package com.twalike.presentation

import com.twalike.data.DatabaseDriverFactory
import com.twalike.data.db.TWAlikeDatabase
import com.twalike.data.di.dataModule
import com.twalike.presentation.chart.ChartViewModel
import com.twalike.presentation.di.presentationModule
import com.twalike.presentation.search.CoinSearchViewModel
import com.twalike.presentation.settings.SettingsViewModel
import com.twalike.presentation.watchlist.WatchlistViewModel
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.koin.core.context.startKoin
import org.koin.core.parameter.parametersOf
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

class WatchlistViewModelHelper : KoinComponent {
    val viewModel: WatchlistViewModel by inject()
}

class CoinSearchViewModelHelper : KoinComponent {
    val viewModel: CoinSearchViewModel by inject()
}

class SettingsViewModelHelper : KoinComponent {
    val viewModel: SettingsViewModel by inject()
}

class ChartViewModelHelper(symbol: String) : KoinComponent {
    val viewModel: ChartViewModel by inject(parameters = { parametersOf(symbol) })
}
