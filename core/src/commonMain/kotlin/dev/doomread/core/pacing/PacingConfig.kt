package dev.doomread.core.pacing

data class PacingConfig(
    val wpm: Int = 300,
    val longWordThreshold: Int = 8,
    val longWordExtraMsPerChar: Int = 10,
    val clausePauseMs: Int = 150,
    val sentencePauseMs: Int = 400,
) {
    init {
        require(wpm in 100..1000) { "WPM must be 100-1000 (FR-1.2)" }
    }
}
