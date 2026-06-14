package com.twalike.domain.indicator

import com.twalike.domain.model.IndicatorConfig
import com.twalike.domain.model.IndicatorResult
import com.twalike.domain.model.KlineWindow

interface Indicator {
    val defaultParams: Map<String, String>
    fun compute(window: KlineWindow, config: IndicatorConfig): IndicatorResult
}
