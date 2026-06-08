package com.twalike.android.di

import com.twalike.data.DatabaseDriverFactory
import com.twalike.data.db.TWAlikeDatabase
import org.koin.android.ext.koin.androidContext
import org.koin.dsl.module

val androidModule = module {
    single { DatabaseDriverFactory(androidContext()).create() }
    single { TWAlikeDatabase(get()) }
}
