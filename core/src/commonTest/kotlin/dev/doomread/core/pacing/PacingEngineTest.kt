package dev.doomread.core.pacing

import dev.doomread.core.tokenizer.Tokenizer
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class PacingEngineTest {

    private fun steps(text: String, wpm: Int = 300) =
        PacingEngine.buildSchedule(Tokenizer.tokenize(text), PacingConfig(wpm = wpm))

    @Test
    fun baseWordDuration() {
        val s = steps("hello", wpm = 600)
        assertEquals(100L, s.single().durationMs)
    }

    @Test
    fun clausePauseAdded() {
        val s = steps("hello, world", wpm = 600)
        val base = 100L
        assertEquals(base + 150, s[0].durationMs)
        assertEquals(base, s[1].durationMs)
    }

    @Test
    fun sentencePauseAdded() {
        val s = steps("hello. world", wpm = 600)
        val base = 100L
        assertEquals(base + 400, s[0].durationMs)
        assertEquals(base, s[1].durationMs)
    }

    @Test
    fun longWordScaled() {
        val s = steps("characterization", wpm = 600)
        // base=100ms, 16 chars, threshold 8, extra = (16-8)*10 = 80ms
        assertEquals(180L, s.single().durationMs)
    }

    @Test
    fun onlyWordsInSchedule() {
        val s = steps("Hello, world. How are you?")
        assertTrue(s.all { it.display.isNotBlank() })
        assertEquals(5, s.size) // Hello, world, How, are, you
    }

    @Test
    fun sentenceStartIndices() {
        val tokens = Tokenizer.tokenize("Hello. How are you?")
        val starts = PacingEngine.sentenceStartIndices(tokens)
        assertEquals(listOf(0, 1), starts) // Hello(0), How(1)
    }
}
