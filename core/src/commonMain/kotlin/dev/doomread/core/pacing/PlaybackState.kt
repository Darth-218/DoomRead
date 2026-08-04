package dev.doomread.core.pacing

enum class PlaybackStatus { STOPPED, PLAYING, PAUSED }

class PlaybackState(
    val schedule: List<Step>,
    private val sentenceStarts: List<Int> = emptyList(),
) {
    var position = 0
        private set
    var status = PlaybackStatus.STOPPED
        private set

    fun play() { status = PlaybackStatus.PLAYING }
    fun pause() { status = PlaybackStatus.PAUSED }

    fun stop() {
        position = 0
        status = PlaybackStatus.STOPPED
    }

    fun next(): Step? {
        if (status != PlaybackStatus.PLAYING) return null
        if (position >= schedule.size) {
            status = PlaybackStatus.STOPPED
            return null
        }
        val step = schedule[position]
        position++
        return step
    }

    fun rewindWord() {
        position = (position - 1).coerceAtLeast(0)
    }

    fun rewindSentence() {
        val target = sentenceStarts.lastOrNull { it < position } ?: 0
        position = target
    }

    fun resumeFrom(pos: Int) {
        position = pos.coerceIn(0, schedule.size)
        status = PlaybackStatus.PLAYING
    }
}
