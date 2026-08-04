package dev.doomread.core.backup

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class BackupCodecTest {

    private val sampleData = BackupData(
        documents = listOf(DocumentEntry("doc1", "My Book", "epub")),
        progress = listOf(ProgressEntry("doc1", 42, "2026-08-01")),
        bookmarks = listOf(BookmarkEntry("doc1", 10, "Chapter 1")),
        stats = listOf(SessionStatsEntry("2026-08-01", 500, 300, 60_000)),
        settings = SettingsEntry(wpm = 300, theme = "dark"),
    )

    @Test
    fun roundTrip() {
        val encoded = BackupCodec.encode(sampleData, exportedAt = "2026-08-01T12:00:00Z")
        val decoded = BackupCodec.decode(encoded).getOrThrow()
        assertEquals(sampleData, decoded)
    }

    @Test
    fun decodeValidEnvelope() {
        val raw = BackupCodec.encode(sampleData, exportedAt = "2026-01-01T00:00:00Z")
        val result = BackupCodec.decode(raw)
        assertTrue(result.isSuccess)
        assertEquals(sampleData, result.getOrThrow())
    }

    @Test
    fun wrongFormatFails() {
        val raw = """{"format":"unknown","version":1,"exportedAt":"x","data":{}}"""
        assertTrue(BackupCodec.decode(raw).isFailure)
    }

    @Test
    fun wrongVersionFails() {
        val raw = """{"format":"doomread-backup","version":999,"exportedAt":"x","data":{}}"""
        assertTrue(BackupCodec.decode(raw).isFailure)
    }

    @Test
    fun garbageInputFails() {
        assertTrue(BackupCodec.decode("not json at all").isFailure)
    }
}
