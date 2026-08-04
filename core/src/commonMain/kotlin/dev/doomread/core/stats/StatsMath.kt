package dev.doomread.core.stats

object StatsMath {
    const val BASELINE_WPM = 250

    fun timeSavedMs(words: Int, actualWpm: Int): Long =
        (words / BASELINE_WPM.toDouble() * 60_000 - words / actualWpm.toDouble() * 60_000).toLong()

    fun averageWpm(words: Int, durationMs: Long): Double =
        if (durationMs <= 0) 0.0 else words / (durationMs / 60_000.0)

    data class SessionStats(
        val wordsRead: Int,
        val durationMs: Long,
        val wpm: Double,
        val timeSavedMs: Long,
    )

    data class Totals(
        val wordsRead: Long,
        val sessionCount: Int,
        val averageWpm: Double,
        val totalTimeSavedMs: Long,
    )

    fun totals(sessions: List<SessionStats>): Totals {
        val words = sessions.sumOf { it.wordsRead }.toLong()
        val duration = sessions.sumOf { it.durationMs }
        return Totals(
            wordsRead = words,
            sessionCount = sessions.size,
            averageWpm = averageWpm(words.toInt(), duration),
            totalTimeSavedMs = sessions.sumOf { it.timeSavedMs },
        )
    }
}
