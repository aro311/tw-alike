package com.twalike.domain.repository

import com.twalike.domain.model.Interval
import com.twalike.domain.model.WatchlistEntry
import kotlinx.coroutines.flow.Flow

interface WatchlistRepository {
    fun observeWatchlist(): Flow<List<WatchlistEntry>>
    suspend fun addEntry(symbol: String)
    suspend fun removeEntry(symbol: String)
    suspend fun reorderEntries(symbols: List<String>)
    suspend fun updateLastInterval(symbol: String, interval: Interval)
}
