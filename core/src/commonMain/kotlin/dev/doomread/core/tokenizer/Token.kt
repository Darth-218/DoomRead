package dev.doomread.core.tokenizer

enum class TokenKind { WORD, CLAUSE_PUNCT, SENTENCE_PUNCT }

data class Token(
    val text: String,
    val kind: TokenKind,
    val index: Int,
    val wordIndex: Int = -1,
)
