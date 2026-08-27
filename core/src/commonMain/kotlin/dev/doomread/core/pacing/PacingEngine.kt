package dev.doomread.core.pacing

import dev.doomread.core.tokenizer.Token
import dev.doomread.core.tokenizer.TokenKind
import kotlin.js.JsExport

@JsExport
data class Step(val display: String, val durationMs: Long, val offset: Int = 0)

object PacingEngine {

    // Quote marks that may arrive as their own punctuation tokens.
    private val QUOTE_CHARS = setOf('"', '“', '”', '«', '»')

    fun buildSchedule(tokens: List<Token>, config: PacingConfig): List<Step> {
        val baseMs = 60_000.0 / config.wpm
        // Resolve each quote token to opening/closing using a running quote
        // state, so a quote is only attached to the word it closes (the last
        // word of the quotation) and never to a word that merely precedes an
        // opening quote (e.g. word"quoted").
        val quoteClosing = mutableMapOf<Int, Boolean>()
        var inQuote = false
        for (k in tokens.indices) {
            val tk = tokens[k]
            if (tk.kind != TokenKind.CLAUSE_PUNCT && tk.kind != TokenKind.SENTENCE_PUNCT) continue
            val ch = tk.text.firstOrNull()
            if (ch != null && ch in QUOTE_CHARS) {
                if (inQuote) {
                    quoteClosing[k] = true
                    inQuote = false
                } else {
                    quoteClosing[k] = false
                    inQuote = true
                }
            }
        }
        return buildList {
            for (i in tokens.indices) {
                val t = tokens[i]
                if (t.kind != TokenKind.WORD) continue
                var ms = baseMs
                if (t.text.length >= config.longWordThreshold) {
                    ms += (t.text.length - config.longWordThreshold) * config.longWordExtraMsPerChar
                }
                // Attach any trailing punctuation to the word so the RSVP
                // display shows it inline (e.g. "Hello." instead of "Hello"),
                // matching how a reader sees the token. Pause durations for
                // that punctuation are folded into this step.
                val display = StringBuilder(t.text)
                var j = i + 1
                while (j < tokens.size &&
                    (tokens[j].kind == TokenKind.CLAUSE_PUNCT ||
                        tokens[j].kind == TokenKind.SENTENCE_PUNCT)
                ) {
                    val tk = tokens[j]
                    val ch = tk.text.firstOrNull()
                    if (ch != null && ch in QUOTE_CHARS) {
                        // Attach a closing quote to the word; drop opening quotes.
                        if (quoteClosing[j] == true) display.append(tk.text)
                        j++
                        continue
                    }
                    display.append(tk.text)
                    when (tk.kind) {
                        TokenKind.CLAUSE_PUNCT -> ms += config.clausePauseMs
                        TokenKind.SENTENCE_PUNCT -> ms += config.sentencePauseMs
                        else -> {}
                    }
                    j++
                }
                add(Step(display.toString(), ms.toLong(), t.offset))
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
