package dev.doomread.core.tokenizer

object Tokenizer {
    private val SENTENCE_END = setOf('.', '!', '?', '…')
    private val CLAUSE_PUNCT = setOf(',', ';', ':', '—', '–')
    private val INTRA_WORD = setOf('\'', '\u2019', '-', '\u2010')

    fun tokenize(text: String): List<Token> {
        val out = mutableListOf<Token>()
        val word = StringBuilder()
        var wordCount = 0

        fun flush() {
            if (word.isNotEmpty()) {
                out += Token(word.toString(), TokenKind.WORD, out.size, wordCount++)
                word.clear()
            }
        }

        for (ch in text) {
            when {
                ch.isLetterOrDigit() || ch.isCombiningMark() || ch in INTRA_WORD ->
                    word.append(ch)
                ch in SENTENCE_END -> {
                    flush()
                    out += Token(ch.toString(), TokenKind.SENTENCE_PUNCT, out.size)
                }
                ch in CLAUSE_PUNCT -> {
                    flush()
                    out += Token(ch.toString(), TokenKind.CLAUSE_PUNCT, out.size)
                }
                ch.isWhitespace() -> flush()
                else -> {
                    flush()
                    out += Token(ch.toString(), TokenKind.CLAUSE_PUNCT, out.size)
                }
            }
        }
        flush()
        return out
    }

    private fun Char.isCombiningMark(): Boolean {
        val cat = category
        return cat == CharCategory.NON_SPACING_MARK ||
            cat == CharCategory.COMBINING_SPACING_MARK ||
            cat == CharCategory.ENCLOSING_MARK
    }
}
