package com.twalike.data.repository

import com.twalike.data.db.TWAlikeDatabase
import com.twalike.domain.model.FavoriteInterval
import com.twalike.domain.model.Interval
import com.twalike.domain.repository.SettingsRepository
import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

private val DEFAULT_FAVORITES = listOf(
    Interval.FIFTEEN_MINUTES,
    Interval.ONE_HOUR,
    Interval.FOUR_HOURS,
    Interval.TWELVE_HOURS,
    Interval.ONE_DAY,
    Interval.THREE_DAYS,
)

class SettingsRepositoryImpl(private val db: TWAlikeDatabase) : SettingsRepository {

    override fun observeFavoriteIntervals(): Flow<List<FavoriteInterval>> =
        db.tWAlikeDatabaseQueries.selectFavoriteIntervals()
            .asFlow()
            .mapToList(Dispatchers.Default)
            .map { rows ->
                if (rows.isEmpty()) {
                    DEFAULT_FAVORITES.mapIndexed { i, interval -> FavoriteInterval(interval, i) }
                } else {
                    rows.map { FavoriteInterval(Interval.fromValue(it.interval_value), it.display_order.toInt()) }
                }
            }

    override suspend fun addFavoriteInterval(interval: Interval): Unit = withContext(Dispatchers.Default) {
        val maxOrder = db.tWAlikeDatabaseQueries.selectFavoriteIntervals().executeAsList()
            .maxOfOrNull { it.display_order }?.toInt() ?: -1
        db.tWAlikeDatabaseQueries.insertFavoriteInterval(interval.value, (maxOrder + 1).toLong())
    }

    override suspend fun removeFavoriteInterval(interval: Interval): Unit = withContext(Dispatchers.Default) {
        db.tWAlikeDatabaseQueries.deleteFavoriteInterval(interval.value)
    }

    override suspend fun reorderFavoriteIntervals(intervals: List<Interval>): Unit = withContext(Dispatchers.Default) {
        db.transaction {
            intervals.forEachIndexed { index, interval ->
                db.tWAlikeDatabaseQueries.insertFavoriteInterval(interval.value, index.toLong())
            }
        }
    }
}
