package com.twalike.domain.repository

import com.twalike.domain.model.Drawing
import com.twalike.domain.model.DrawingType
import com.twalike.domain.model.DrawingPoint
import kotlinx.coroutines.flow.Flow

interface DrawingRepository {
    fun observeDrawings(symbol: String): Flow<List<Drawing>>
    suspend fun addDrawing(symbol: String, type: DrawingType, points: List<DrawingPoint>): Drawing
    suspend fun removeDrawing(id: String)
}
