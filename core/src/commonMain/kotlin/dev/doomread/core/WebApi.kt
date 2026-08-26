package dev.doomread.core

import dev.doomread.core.backup.BackupCodec
import dev.doomread.core.backup.BackupData
import dev.doomread.core.pacing.PacingConfig
import dev.doomread.core.pacing.PacingEngine
import dev.doomread.core.stats.StatsMath
import dev.doomread.core.tokenizer.Tokenizer
import kotlin.js.JsExport

/**
 * JS-friendly representation of one reader step. The core's own Step carries a
 * boxed kotlin.Long durationMs, which is awkward to consume from JS; exposing a
 * Double keeps setTimeout math simple in the browser.
 */
@JsExport
data class ScheduleStep(val display: String, val durationMs: Double)

/**
 * Primitive-friendly entry points for the Web UI.
 * Kotlin data classes are awkward to construct from JS, so the Svelte app
 * talks to this facade instead of calling the core objects directly.
 * @JsExport keeps these reachable from the production ESM build (otherwise
 * whole-program DCE strips them because there is no `main` entry point).
 */
@JsExport
object WebApi {

    fun schedule(text: String, wpm: Int): Array<ScheduleStep> =
        PacingEngine.buildSchedule(Tokenizer.tokenize(text), PacingConfig(wpm = wpm))
            .map { ScheduleStep(it.display, it.durationMs.toDouble()) }
            .toTypedArray()

    fun sentenceStarts(text: String): Array<Int> =
        PacingEngine.sentenceStartIndices(Tokenizer.tokenize(text)).toTypedArray()

    fun decodeBackup(raw: String): BackupData? =
        BackupCodec.decode(raw).getOrNull()

    fun timeSavedMs(words: Int, actualWpm: Int): Long =
        StatsMath.timeSavedMs(words, actualWpm)

    fun averageWpm(words: Int, durationMs: Long): Double =
        StatsMath.averageWpm(words, durationMs)
}
