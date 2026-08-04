package dev.doomread.core.backup

import kotlinx.serialization.json.Json

object BackupCodec {
    private val json = Json { prettyPrint = true; ignoreUnknownKeys = true }

    fun encode(data: BackupData, exportedAt: String): String =
        json.encodeToString(BackupEnvelope(BACKUP_FORMAT, BACKUP_VERSION, exportedAt, data))

    fun decode(raw: String): Result<BackupData> = runCatching {
        val envelope = json.decodeFromString<BackupEnvelope>(raw)
        require(envelope.format == BACKUP_FORMAT) { "Not a DoomRead backup" }
        require(envelope.version == BACKUP_VERSION) { "Unsupported backup version ${envelope.version}" }
        envelope.data
    }
}
