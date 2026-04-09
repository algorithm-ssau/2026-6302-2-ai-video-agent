import { eventType } from "inngest";
import { serve } from "inngest/next";
import { inngest } from "./inngest-client";
import { generateVideoScriptStep } from "./video-steps/generate-script";
import { generateVoiceForScript } from "./tts";
import { supabaseAdmin } from "./supabase/admin";

const helloWorldEvent = eventType("test/hello.world");
const videoGenerateEvent = eventType("video/generate");

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    name: "Hello World",
    triggers: [helloWorldEvent],
  },
  async ({ event }) => {
    return { message: `Hello, ${event.data?.name || "World"}!` };
  }
);

export const generateVideo = inngest.createFunction(
  {
    id: "generate-video",
    name: "Generate Video",
    triggers: [videoGenerateEvent],
  },
  async ({ event, step }) => {
    const { seriesId, userId } = event.data;

    if (typeof seriesId !== "string" || !seriesId) {
      throw new Error("Invalid event data: seriesId must be a non-empty string");
    }

    if (typeof userId !== "string" || !userId) {
      throw new Error("Invalid event data: userId must be a non-empty string");
    }

    const scriptData = await step.run("generate-video-script", async () => {
      console.log("Generating video script for series:", seriesId);
      return await generateVideoScriptStep(seriesId, userId);
    });

    const voiceResult = await step.run("generate-voice", async () => {
      console.log("Generating voice using TTS");
      try {
        const uploads = await generateVoiceForScript(seriesId, userId, scriptData);
        return { success: true, uploads };
      } catch (err) {
        console.error("TTS generation failed:", err);
        throw err;
      }
    });

    const captionResult = await step.run("generate-caption", async () => {
      console.log("Generating captions using Deepgram");
      try {
        const { generateCaptionsForSeries } = await import("./captions");
        const captions = await generateCaptionsForSeries(seriesId);
        return { success: true, captions };
      } catch (err) {
        console.error("Caption generation failed:", err);
        throw err;
      }
    });

    const imagesResult = await step.run("generate-images", async () => {
      console.log("Generating images using Hugging Face models");
      try {
        const { generateImagesForScript } = await import("./images");
        const urls = await generateImagesForScript(seriesId, scriptData);
        return { success: true, images: urls };
      } catch (err) {
        console.error("Image generation failed:", err);
        throw err;
      }
    });

    await step.run("save-to-database", async () => {
      console.log("Saving video data to database");

      try {
        const supabase = supabaseAdmin();

        const voiceRes = voiceResult as unknown as { uploads?: unknown } | undefined;
        const audioFiles = Array.isArray(voiceRes?.uploads) ? (voiceRes!.uploads as string[]) : [];
        const audioUrl = audioFiles.length > 0 ? audioFiles[0] : null;

        const imagesRes = imagesResult as unknown as { images?: unknown } | undefined;
        const images = Array.isArray(imagesRes?.images) ? (imagesRes!.images as string[]) : [];

        const captionRes = captionResult as unknown as { captions?: unknown } | undefined;
        const captions = (captionRes?.captions as Record<string, unknown> | undefined) || {};

        // Store the `user_id` from the series row directly as text (videos.user_id is now text).
        const { data: seriesRow } = await supabase.from("video_agent_series").select("user_id").eq("id", seriesId).single();
        const seriesUserRaw = seriesRow?.user_id ?? null; // clerk_id text

        const insertRow: Record<string, unknown> = {
          series_id: seriesId,
          user_id: seriesUserRaw,
          title: scriptData.title || null,
          status: "generated",
          script_data: scriptData,
          audio_url: audioUrl,
          audio_files: audioFiles,
          images: images,
          captions_vtt: captions.vtt || null,
          captions_srt: captions.srt || null,
          captions_words: captions.words || [],
          duration_seconds: scriptData.totalDuration || null,
          scene_count: Array.isArray(scriptData.scenes) ? scriptData.scenes.length : null,
        };

        const { data: videoData, error: insertError } = await supabase.from("videos").insert(insertRow).select("id").single();
        if (insertError) {
          console.error("Failed to insert video row:", insertError);
          throw insertError;
        }

        // Update series status and step_payload.video_id
        const { data: existing } = await supabase.from("video_agent_series").select("step_payload").eq("id", seriesId).single();
        const currentPayload = existing?.step_payload && typeof existing.step_payload === "object" ? existing.step_payload as Record<string, unknown> : {};
        await supabase.from("video_agent_series").update({ status: "generated", step_payload: { ...currentPayload, video_id: videoData.id }, updated_at: new Date().toISOString() }).eq("id", seriesId);

        return { success: true, videoId: videoData.id };
      } catch (err) {
        console.error("Save to database failed:", err);
        throw err;
      }
    });

    await step.run("update-series-status", async () => {
      console.log("Updating series status (placeholder)");
      return { success: true };
    });

    return {
      success: true,
      seriesId,
      scriptTitle: scriptData.title,
      sceneCount: scriptData.scenes.length,
    };
  }
);

export default serve({
  client: inngest,
  functions: [helloWorld, generateVideo],
});
