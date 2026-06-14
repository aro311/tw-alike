package com.twalike.data.di

import com.twalike.data.api.BinanceApiClient
import com.twalike.data.repository.DrawingRepositoryImpl
import com.twalike.data.repository.IndicatorRepositoryImpl
import com.twalike.data.repository.MarketRepositoryImpl
import com.twalike.data.repository.SettingsRepositoryImpl
import com.twalike.data.repository.WatchlistRepositoryImpl
import com.twalike.domain.repository.DrawingRepository
import com.twalike.domain.repository.IndicatorRepository
import com.twalike.domain.repository.MarketRepository
import com.twalike.domain.repository.SettingsRepository
import com.twalike.domain.repository.WatchlistRepository
import com.twalike.domain.usecase.defaultIndicatorRegistry
import org.koin.dsl.module

val dataModule = module {
    single { BinanceApiClient() }
    single<WatchlistRepository> { WatchlistRepositoryImpl(get()) }
    single<MarketRepository> { MarketRepositoryImpl(get(), get()) }
    single<IndicatorRepository> { IndicatorRepositoryImpl(get(), defaultIndicatorRegistry) }
    single<DrawingRepository> { DrawingRepositoryImpl(get()) }
    single<SettingsRepository> { SettingsRepositoryImpl(get()) }
}
