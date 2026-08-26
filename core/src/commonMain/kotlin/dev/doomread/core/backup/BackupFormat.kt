package dev.doomread.core.backup

import kotlin.js.JsExport
import kotlinx.serialization.Serializable

const val BACKUP_FORMAT = "doomread-backup"
const val BACKUP_VERSION = 1

@Serializable
data class BackupEnvelope(
    val format: String,
    val version: Int,
    val exportedAt: String,
    val data: BackupData,
)

@Serializable
@JsExport
data class BackupData(
    val documents: List<DocumentEntry> = emptyList(),
    val progress: List<ProgressEntry> = emptyList(),
    val bookmarks: List<BookmarkEntry> = emptyList(),
    val stats: List<SessionStatsEntry> = emptyList(),
    val settings: SettingsEntry = SettingsEntry(),
)

@Serializable
@JsExport
data class DocumentEntry(val id: String, val title: String, val kind: String)

@Serializable
@JsExport
data class ProgressEntry(val documentId: String, val stepIndex: Int, val updatedAt: String)

@Serializable
@JsExport
data class BookmarkEntry(val documentId: String, val stepIndex: Int, val note: String = "")

@Serializable
@JsExport
data class SessionStatsEntry(val date: String, val wordsRead: Int, val wpm: Int, val durationMs: Long)

@Serializable
@JsExport
data class SettingsEntry(val wpm: Int = 300, val theme: String = "default", val font: String = "sans", val displayMode: String = "light")
