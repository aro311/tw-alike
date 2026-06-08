package com.twalike.domain.repository

import com.twalike.domain.model.Interval
import com.twalike.domain.model.Kline
import com.twalike.domain.model.KlineWindow
import com.twalike.domain.model.Symbol
import com.twalike.domain.model.Ticker
import kotlinx.coroutines.flow.Flow

interface MarketRepository {
    fun observeTickers(): Flow<List<Ticker>>
    fun observeKlines(symbol: String, interval: Interval): Flow<Kline>
    suspend fun getKlineWindow(symbol: String, interval: Interval): KlineWindow
    suspend fun getSymbolCatalog(): List<Symbol>
    suspend fun searchSymbols(query: String): List<Symbol>
}
