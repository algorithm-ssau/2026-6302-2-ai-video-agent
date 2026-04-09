import { supabaseAdmin } from "./supabase/admin";
import { getDeepgramKey, getFonadaKey } from "./env";
import { DeepgramVoices, FonadalabVoices, Language } from "./voiceData";
import { VideoScript } from "./video-script-generator";

type Endpoint = {
  url: string;
  body?: string;
  bodyVariants?: string[];
};

async function uploadAudio(seriesId: string, fileName: string, buffer: Buffer, contentType = "audio/mpeg") {
  const supabase = supabaseAdmin();
  const bucket = "voiceovers";
  const path = `series/${seriesId}/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function generateDeepgramTTS(text: string, voiceName: string, seriesId: string, fileName: string) {
  const key = getDeepgramKey();
  // Use the documented Deepgram TTS endpoint: POST /v1/speak
  const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceName)}&format=mp3`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "(no body)");
    throw new Error(`Deepgram TTS error: ${res.status} ${txt} (url=${url})`);
  }

  const ab = await res.arrayBuffer();
  const buffer = Buffer.from(ab);
  return await uploadAudio(seriesId, fileName, buffer, "audio/mpeg");
}

export async function generateFonadaTTS(text: string, voiceName: string, locale: string, seriesId: string, fileName: string) {
  const key = getFonadaKey();
  const endpoint = "https://api.fonadalabs.ai/v1/tts";

  const body = {
    input: text,
    voice: voiceName,
    locale,
    format: "mp3",
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`FonadaLabs TTS error: ${res.status} ${txt}`);
  }

  const ab = await res.arrayBuffer();
  const buffer = Buffer.from(ab);

  return await uploadAudio(seriesId, fileName, buffer, "audio/mpeg");
}

export async function generateVoiceForScript(seriesId: string, userId: string, script: VideoScript) {
  const supabase = supabaseAdmin();
  const { data: series } = await supabase.from("video_agent_series").select("language, selected_voice").eq("id", seriesId).single();

  const chosenLanguage = (Language.find((l) => l.language === (series?.language || "English")) || Language[0]);
  const provider = chosenLanguage.modelName || "deepgram";

  // Create a single combined text from all scenes and generate one voice file
  if (!script || !Array.isArray(script.scenes)) {
    throw new Error("Invalid script: missing scenes array");
  }

  const texts: string[] = [];
  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    if (!scene || typeof scene.text !== "string") {
      throw new Error(`Invalid script: scene at index ${i} missing 'text' field`);
    }
    // Add scene text. Consider adding punctuation or pauses here if desired.
    texts.push(scene.text.trim());
  }

  const combinedText = texts.join(" \n\n");
  const fileName = `voiceover-${Date.now()}.mp3`;

  let url: string;
  if (provider === "fonadalab") {
    const voice = series?.selected_voice || "vanee";
    url = await generateFonadaTTS(combinedText, voice, chosenLanguage.modelLangCode, seriesId, fileName);
  } else {
    const voice = series?.selected_voice || "aura-2-odysseus-en";
    url = await generateDeepgramTTS(combinedText, voice, seriesId, fileName);
  }

  // Save single uploaded audio reference to DB (array with one item)
  await supabase
    .from("video_agent_series")
    .update({ audio_files: [url], updated_at: new Date().toISOString() })
    .eq("id", seriesId);

  return [url];
}
