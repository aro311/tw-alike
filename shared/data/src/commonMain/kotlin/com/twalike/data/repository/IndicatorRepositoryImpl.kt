package com.twalike.data.repository

import com.twalike.data.db.TWAlikeDatabase
import com.twalike.domain.indicator.Indicator
import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorType
import com.twalike.domain.repository.IndicatorRepository
import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class IndicatorRepositoryImpl(
    private val db: TWAlikeDatabase,
    private val registry: Map<IndicatorType, Indicator>,
) : IndicatorRepository {

    override fun observeConfigs(symbol: String): Flow<List<IndicatorConfig>> =
        db.tWAlikeDatabaseQueries.selectIndicatorConfigs(symbol)
            .asFlow()
            .mapToList(Dispatchers.Default)
            .map { rows ->
                if (rows.isEmpty()) defaultConfigs(symbol) else rows.map { row ->
                    IndicatorConfig(
                        symbol = row.symbol,
                        type = IndicatorType.valueOf(row.indicator_type),
                        isVisible = row.is_visible != 0L,
                        params = Json.decodeFromString(row.params_json),
                    )
                }
            }

    override suspend fun saveConfig(config: IndicatorConfig): Unit = withContext(Dispatchers.Default) {
        db.tWAlikeDatabaseQueries.insertIndicatorConfig(
            config.symbol,
            config.type.name,
            if (config.isVisible) 1L else 0L,
            Json.encodeToString(config.params),
        )
    }

    override suspend fun setVisible(symbol: String, type: IndicatorType, visible: Boolean): Unit =
        withContext(Dispatchers.Default) {
            db.tWAlikeDatabaseQueries.updateIndicatorVisibility(
                if (visible) 1L else 0L, symbol, type.name
            )
        }

    private fun defaultConfigs(symbol: String) = registry.map { (type, indicator) ->
        IndicatorConfig(
            symbol = symbol,
            type = type,
            isVisible = type == IndicatorType.VOLUME,
            params = indicator.defaultParams,
        )
    }
}
