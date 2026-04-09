import { supabaseAdmin } from "./supabase/admin";
import { getDeepgramKey } from "./env";

function formatTimestampVTT(seconds: number) {
  if (!isFinite(seconds)) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function formatTimestampSRT(seconds: number) {
  if (!isFinite(seconds)) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export async function generateCaptionsForSeries(seriesId: string) {
  const supabase = supabaseAdmin();

  const { data: series, error } = await supabase
    .from("video_agent_series")
    .select("*")
    .eq("id", seriesId)
    .single();

  if (error || !series) throw new Error(`Series not found: ${error?.message}`);

  // Try several places for the audio URL: top-level `audio_files`, `voiceover_url`, or inside `step_payload`.
  type SeriesRow = {
    id: string;
    audio_files?: string[];
    voiceover_url?: string;
    step_payload?: Record<string, unknown>;
    [key: string]: unknown;
  };

  const s = series as unknown as SeriesRow;
  let audioUrl: string | null = null;

  if (Array.isArray(s.audio_files) && s.audio_files.length > 0) {
    audioUrl = String(s.audio_files[0]);
  }

  if (!audioUrl && typeof s.voiceover_url === "string") {
    audioUrl = s.voiceover_url;
  }

  if (!audioUrl && s.step_payload && typeof s.step_payload === "object") {
    const sp = s.step_payload as Record<string, unknown>;
    const spAudio = sp["audio_files"];
    if (Array.isArray(spAudio) && (spAudio as unknown[]).length > 0) audioUrl = String((spAudio as unknown[])[0]);
    if (!audioUrl && typeof sp["voiceover_url"] === "string") audioUrl = String(sp["voiceover_url"]);
  }
  if (!audioUrl) throw new Error("No audio file found for series");

  const key = getDeepgramKey();

  const params = new URLSearchParams({ punctuate: "true", model: "general" });
  const endpoint = `https://api.deepgram.com/v1/listen?${params.toString()}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: audioUrl }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Deepgram STT error: ${res.status} ${body}`);
  }

  const json = await res.json();

  // Navigate to words array: results.channels[0].alternatives[0].words
  const rawWords = (json?.results?.channels?.[0]?.alternatives?.[0]?.words as unknown[]) || [];
  const transcript = String(json?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "");

  // Deepgram word shape (partial) - avoid `any`
  type DeepgramWord = {
    word?: string;
    token?: string;
    start?: number | string;
    end?: number | string;
    confidence?: number | string;
  };

  // Normalize words into explicit JSON blocks with numeric timestamps and confidence
  const wordsNormalized: Array<{ word: string; start: number; end: number; confidence?: number }> = Array.isArray(rawWords)
    ? rawWords.map((w) => {
        const ww = w as DeepgramWord;
        const start = typeof ww.start === "number" ? ww.start : parseFloat(String(ww.start ?? "0")) || 0;
        const end = typeof ww.end === "number" ? ww.end : parseFloat(String(ww.end ?? "0")) || 0;
        const confidence = typeof ww.confidence === "number" ? ww.confidence : ww.confidence ? parseFloat(String(ww.confidence)) : undefined;
        return {
          word: String(ww.word ?? ww.token ?? ""),
          start,
          end,
          confidence,
        };
      })
    : [];

  // Build VTT and SRT by grouping words into cues (~ up to 4s or 10 words)
  const cues: { start: number; end: number; text: string }[] = [];
  let current: { start: number; end: number; parts: string[] } | null = null;

  for (const w of wordsNormalized) {
    const start = w.start;
    const end = w.end;
    const word = w.word;

    if (!current) {
      current = { start, end, parts: [word] };
      continue;
    }

    // If this word would make the cue too long in time or words, flush
    const duration = end - current.start;
    if (current.parts.length >= 10 || duration >= 4) {
      cues.push({ start: current.start, end: current.end, text: current.parts.join(" ") });
      current = { start, end, parts: [word] };
    } else {
      current.parts.push(word);
      current.end = end;
    }
  }

  if (current) cues.push({ start: current.start, end: current.end, text: current.parts.join(" ") });

  // Build VTT
  const vttLines = ["WEBVTT\n"];
  cues.forEach((c) => {
    vttLines.push(`${formatTimestampVTT(c.start)} --> ${formatTimestampVTT(c.end)}`);
    vttLines.push(c.text);
    vttLines.push("");
  });
  const vtt = vttLines.join("\n");

  // Build SRT
  const srtLines: string[] = [];
  cues.forEach((c, idx) => {
    srtLines.push(String(idx + 1));
    srtLines.push(`${formatTimestampSRT(c.start)} --> ${formatTimestampSRT(c.end)}`);
    srtLines.push(c.text);
    srtLines.push("");
  });
  const srt = srtLines.join("\n");

  // Merge words into step_payload to avoid relying on top-level schema changes
  const currentPayload = (s.step_payload && typeof s.step_payload === "object") ? (s.step_payload as Record<string, unknown>) : {};

  await supabase
    .from("video_agent_series")
    .update({
      transcript: transcript,
      captions_vtt: vtt,
      captions_srt: srt,
      step_payload: { ...currentPayload, captions_words: wordsNormalized },
      updated_at: new Date().toISOString(),
    })
    .eq("id", seriesId);

  return { transcript, vtt, srt, words: wordsNormalized };
}
