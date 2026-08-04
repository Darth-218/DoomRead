package dev.doomread.core.stats

import kotlin.test.Test
import kotlin.test.assertEquals

class StatsMathTest {

    @Test
    fun timeSaved() {
        // 500 words at 500 WPM = 60s; at 250 WPM = 120s; saved = 60s = 60000ms
        val saved = StatsMath.timeSavedMs(words = 500, actualWpm = 500)
        assertEquals(60_000L, saved)
    }

    @Test
    fun averageWpm() {
        val avg = StatsMath.averageWpm(words = 300, durationMs = 60_000)
        assertEquals(300.0, avg, 0.01)
    }

    @Test
    fun averageWpmZeroDuration() {
        assertEquals(0.0, StatsMath.averageWpm(words = 100, durationMs = 0))
    }

    @Test
    fun totalsAggregation() {
        val sessions = listOf(
            StatsMath.SessionStats(100, 30_000, 200.0, 10_000),
            StatsMath.SessionStats(200, 60_000, 200.0, 48_000),
        )
        val t = StatsMath.totals(sessions)
        assertEquals(300L, t.wordsRead)
        assertEquals(2, t.sessionCount)
        assertEquals(58_000L, t.totalTimeSavedMs)
    }
}
