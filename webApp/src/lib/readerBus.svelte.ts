// Bridge between the Reader (RSVP cursor) and the side SourcePanel.
// SourcePanel registers a jump handler; Reader publishes the current
// source character offset of the word being read. Clicking a word in the
// panel calls jump(), and the panel highlights the word at currentOffset.

export const readerBus = $state({
  currentOffset: 0,
  jump: null as null | ((offset: number) => void),
})

export function setCurrentOffset(offset: number): void {
  readerBus.currentOffset = offset
}

export function setJumpHandler(fn: ((offset: number) => void) | null): void {
  readerBus.jump = fn
}

export function jumpTo(offset: number): void {
  readerBus.jump?.(offset)
}
