package dev.doomread.core.pacing

import dev.doomread.core.tokenizer.Token
import dev.doomread.core.tokenizer.TokenKind
import kotlin.js.JsExport

@JsExport
data class Step(val display: String, val durationMs: Long)

object PacingEngine {

    fun buildSchedule(tokens: List<Token>, config: PacingConfig): List<Step> {
        val baseMs = 60_000.0 / config.wpm
        return buildList {
            for (i in tokens.indices) {
                val t = tokens[i]
                if (t.kind != TokenKind.WORD) continue
                var ms = baseMs
                if (t.text.length >= config.longWordThreshold) {
                    ms += (t.text.length - config.longWordThreshold) * config.longWordExtraMsPerChar
                }
                when (tokens.getOrNull(i + 1)?.kind) {
                    TokenKind.CLAUSE_PUNCT -> ms += config.clausePauseMs
                    TokenKind.SENTENCE_PUNCT -> ms += config.sentencePauseMs
                    else -> {}
                }
                add(Step(t.text, ms.toLong()))
            }
        }
    }

    fun sentenceStartIndices(tokens: List<Token>): List<Int> {
        val starts = mutableListOf<Int>()
        var wordCount = 0
        var atSentenceStart = true
        for (t in tokens) {
            when (t.kind) {
                TokenKind.WORD -> {
                    if (atSentenceStart) starts += wordCount
                    wordCount++
                    atSentenceStart = false
                }
                TokenKind.SENTENCE_PUNCT -> atSentenceStart = true
                else -> {}
            }
        }
        return starts
    }
}
