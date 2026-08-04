package dev.doomread.core.pacing

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlaybackStateTest {

    private fun schedule() = listOf(
        Step("Hello", 100),
        Step("world", 200),
        Step("How", 300),
    )

    private fun sentenceState() = PlaybackState(
        schedule = schedule(),
        sentenceStarts = listOf(0, 2),
    )

    @Test
    fun playAndNext() {
        val ps = sentenceState()
        ps.play()
        assertEquals(PlaybackStatus.PLAYING, ps.status)
        assertEquals("Hello", ps.next()?.display)
        assertEquals("world", ps.next()?.display)
        assertEquals("How", ps.next()?.display)
        assertNull(ps.next())
        assertEquals(PlaybackStatus.STOPPED, ps.status)
    }

    @Test
    fun pauseHolds() {
        val ps = sentenceState()
        ps.play()
        assertEquals("Hello", ps.next()?.display)
        ps.pause()
        assertEquals(PlaybackStatus.PAUSED, ps.status)
        assertEquals(null, ps.next())
    }

    @Test
    fun rewindWord() {
        val ps = sentenceState()
        ps.play()
        ps.next()
        assertEquals(1, ps.position)
        ps.rewindWord()
        assertEquals(0, ps.position)
    }

    @Test
    fun rewindSentence() {
        val ps = sentenceState()
        ps.play()
        ps.next() // consumed 0, position=1
        ps.next() // consumed 1, position=2
        assertEquals(2, ps.position)
        ps.rewindSentence()
        assertEquals(0, ps.position) // previous sentence start
    }

    @Test
    fun rewindSentenceFromMidSentence() {
        val ps = sentenceState()
        ps.play()
        ps.next() // 0 Hello
        ps.next() // 1 world
        ps.rewindSentence()
        assertEquals(0, ps.position) // back to start of sentence
    }

    @Test
    fun resumeFrom() {
        val ps = sentenceState()
        ps.resumeFrom(2)
        assertEquals(2, ps.position)
        assertEquals("How", ps.next()?.display)
    }

    @Test
    fun stopResets() {
        val ps = sentenceState()
        ps.play()
        ps.next()
        ps.stop()
        assertEquals(0, ps.position)
        assertEquals(PlaybackStatus.STOPPED, ps.status)
    }
}
