package dev.doomread.core.tokenizer

import kotlin.test.Test
import kotlin.test.assertEquals

class TokenizerTest {

    private fun words(text: String) =
        Tokenizer.tokenize(text).filter { it.kind == TokenKind.WORD }

    private fun kinds(text: String) =
        Tokenizer.tokenize(text).map { it.kind }

    @Test
    fun diacriticsPreserved() {
        val tokens = words("élève naïve café")
        assertEquals(listOf("élève", "naïve", "café"), tokens.map { it.text })
    }

    @Test
    fun intraWordApostrophe() {
        val tokens = words("don't l'école state-of-the-art")
        assertEquals(listOf("don't", "l'école", "state-of-the-art"), tokens.map { it.text })
    }

    @Test
    fun sentenceAndClausePunct() {
        val k = kinds("Hello, world. What?")
        assertEquals(
            listOf(
                TokenKind.WORD,          // Hello
                TokenKind.CLAUSE_PUNCT,  // ,
                TokenKind.WORD,          // world
                TokenKind.SENTENCE_PUNCT,// .
                TokenKind.WORD,          // What
                TokenKind.SENTENCE_PUNCT,// ?
            ),
            k,
        )
    }

    @Test
    fun wordIndicesSequential() {
        val tokens = words("one two three")
        assertEquals(listOf(0, 1, 2), tokens.map { it.wordIndex })
    }

    @Test
    fun emptyInput() {
        assertEquals(emptyList(), Tokenizer.tokenize(""))
    }

    @Test
    fun nonAsciiLetters() {
        val tokens = words("привет مرحبا こんにちは")
        assertEquals(listOf("привет", "مرحبا", "こんにちは"), tokens.map { it.text })
    }

    @Test
    fun unknownCharBecomesClauseBreak() {
        val k = kinds("a @ b")
        assertEquals(
            listOf(TokenKind.WORD, TokenKind.CLAUSE_PUNCT, TokenKind.WORD),
            k,
        )
    }
}
