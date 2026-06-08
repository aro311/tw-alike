package com.twalike.data

import android.content.Context
import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import com.twalike.data.db.TWAlikeDatabase

class DatabaseDriverFactory(private val context: Context) {
    fun create(): SqlDriver = AndroidSqliteDriver(TWAlikeDatabase.Schema, context, "twalike.db")
}
