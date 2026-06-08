package com.twalike.data.repository

import com.twalike.data.db.TWAlikeDatabase
import com.twalike.domain.model.Drawing
import com.twalike.domain.model.DrawingPoint
import com.twalike.domain.model.DrawingType
import com.twalike.domain.repository.DrawingRepository
import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class DrawingRepositoryImpl(private val db: TWAlikeDatabase) : DrawingRepository {

    override fun observeDrawings(symbol: String): Flow<List<Drawing>> =
        db.tWAlikeDatabaseQueries.selectDrawings(symbol)
            .asFlow()
            .mapToList(Dispatchers.Default)
            .map { rows ->
                rows.map { row ->
                    Drawing(
                        id = row.id,
                        symbol = row.symbol,
                        type = DrawingType.valueOf(row.drawing_type),
                        points = Json.decodeFromString(row.points_json),
                    )
                }
            }

    override suspend fun addDrawing(
        symbol: String,
        type: DrawingType,
        points: List<DrawingPoint>,
    ): Drawing = withContext(Dispatchers.Default) {
        val id = "${symbol}_${type.name}_${points.firstOrNull()?.time ?: 0}"
        val drawing = Drawing(id, symbol, type, points)
        db.tWAlikeDatabaseQueries.insertDrawing(id, symbol, type.name, Json.encodeToString(points))
        drawing
    }

    override suspend fun removeDrawing(id: String): Unit = withContext(Dispatchers.Default) {
        db.tWAlikeDatabaseQueries.deleteDrawing(id)
    }
}
