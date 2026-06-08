package com.twalike.data

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver
import com.twalike.data.db.TWAlikeDatabase

class DatabaseDriverFactory {
    fun create(): SqlDriver = NativeSqliteDriver(TWAlikeDatabase.Schema, "twalike.db")
}
