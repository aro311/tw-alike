package com.twalike.domain.repository

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorType
import kotlinx.coroutines.flow.Flow

interface IndicatorRepository {
    fun observeConfigs(symbol: String): Flow<List<IndicatorConfig>>
    suspend fun saveConfig(config: IndicatorConfig)
    suspend fun setVisible(symbol: String, type: IndicatorType, visible: Boolean)
}
