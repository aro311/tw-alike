package com.twalike.android

import android.app.Application
import com.twalike.android.di.androidModule
import com.twalike.data.di.dataModule
import com.twalike.presentation.di.presentationModule
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin

class TWAlikeApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@TWAlikeApplication)
            modules(androidModule, dataModule, presentationModule)
        }
    }
}
