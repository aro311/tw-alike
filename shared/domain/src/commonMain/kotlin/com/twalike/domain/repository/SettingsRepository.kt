package com.twalike.domain.repository

import com.twalike.domain.model.FavoriteInterval
import com.twalike.domain.model.Interval
import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    fun observeFavoriteIntervals(): Flow<List<FavoriteInterval>>
    suspend fun addFavoriteInterval(interval: Interval)
    suspend fun removeFavoriteInterval(interval: Interval)
    suspend fun reorderFavoriteIntervals(intervals: List<Interval>)
}
