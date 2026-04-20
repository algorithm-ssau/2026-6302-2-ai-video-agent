import type { CaptionWord } from "@/remotion/types";

export type CaptionChunk = {
  text: string;
  startSeconds: number;
  endSeconds: number;
  startFrame: number;
  endFrame: number;
};

const MIN_WORDS = 2;
const MAX_WORDS = 3;

export function normalizeCaptionWords(words: CaptionWord[]): CaptionWord[] {
  return (Array.isArray(words) ? words : [])
    .filter((w) => typeof w?.word === "string" && w.word.trim().length > 0)
    .map((w) => ({
      word: w.word.trim(),
      start: Number.isFinite(w.start) ? Number(w.start) : 0,
      end: Number.isFinite(w.end) ? Number(w.end) : 0,
      confidence: typeof w.confidence === "number" ? w.confidence : undefined,
    }))
    .filter((w) => w.end >= w.start)
    .sort((a, b) => a.start - b.start);
}

export function chunkCaptionWords(words: CaptionWord[], fps: number): CaptionChunk[] {
  const clean = normalizeCaptionWords(words);
  if (!clean.length || !Number.isFinite(fps) || fps <= 0) return [];

  const chunks: CaptionChunk[] = [];
  let i = 0;

  while (i < clean.length) {
    const remaining = clean.length - i;
    let take = Math.min(MAX_WORDS, remaining);

    // Avoid a one-word tail by shrinking the current chunk.
    if (remaining > MAX_WORDS && remaining - take === 1) {
      take = MIN_WORDS;
    }

    const group = clean.slice(i, i + take);
    const startSeconds = group[0].start;
    const endSeconds = group[group.length - 1].end;
    const startFrame = Math.max(0, Math.floor(startSeconds * fps));
    const endFrame = Math.max(startFrame + 1, Math.ceil(endSeconds * fps));

    chunks.push({
      text: group.map((w) => w.word).join(" "),
      startSeconds,
      endSeconds,
      startFrame,
      endFrame,
    });
    i += take;
  }

  return chunks;
}

export function getDurationFromCaptionWords(words: CaptionWord[]): number {
  const clean = normalizeCaptionWords(words);
  if (!clean.length) return 5;
  return Math.max(5, clean[clean.length - 1].end + 0.75);
}

