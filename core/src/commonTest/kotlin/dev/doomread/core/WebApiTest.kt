package dev.doomread.core

import dev.doomread.core.backup.BackupCodec
import dev.doomread.core.backup.BackupData
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class WebApiTest {

    @Test
    fun scheduleProducesWordsWithPauses() {
        val steps = WebApi.schedule("Hello, world.", wpm = 600)
        assertEquals(listOf("Hello", "world"), steps.map { it.display })
        assertEquals(250.0, steps[0].durationMs, 0.0) // 100 base + 150 clause pause
        assertEquals(500.0, steps[1].durationMs, 0.0) // 100 base + 400 sentence pause
    }

    @Test
    fun sentenceStartsWork() {
        val starts = WebApi.sentenceStarts("Hello. How are you?")
        assertEquals(listOf(0, 1), starts.toList())
    }

    @Test
    fun decodeBackupRoundTrip() {
        val raw = BackupCodec.encode(BackupData(), "2026-08-01T00:00:00Z")
        assertNotNull(WebApi.decodeBackup(raw))
    }

    @Test
    fun decodeBackupRejectsGarbage() {
        assertNull(WebApi.decodeBackup("not json"))
    }

    @Test
    fun statsAccessible() {
        assertEquals(60_000L, WebApi.timeSavedMs(words = 500, actualWpm = 500))
        assertEquals(300.0, WebApi.averageWpm(words = 300, durationMs = 60_000), 0.01)
    }
}
