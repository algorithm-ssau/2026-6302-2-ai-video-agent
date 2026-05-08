import { eventType } from "inngest";
import { unlink } from "node:fs/promises";
import { inngest } from "./inngest-client";
import { generateVideoScriptStep } from "./video-steps/generate-script";
import { generateVoiceForScript } from "./tts";
import { supabaseAdmin } from "./supabase/admin";
import { publishVkVideoToCommunity } from "./social/vk";
import { buildHashtags } from "./social/build-hashtags";
import type { CaptionWord } from "@/remotion/types";

const helloWorldEvent = eventType("test/hello.world");
const videoGenerateEvent = eventType("video/generate");

async function dispatchSeriesPlatforms({
  seriesId,
  userId,
  selectedPlatforms,
  videoUrl,
  videoId,
}: {
  seriesId: string;
  userId: string;
  selectedPlatforms: string[];
  videoUrl: string;
  videoId: string;
}) {
  const supabase = supabaseAdmin();
  const normalizedPlatforms = selectedPlatforms.map((p) => p.toLowerCase());

  const { data: videoRow, error: videoError } = await supabase
    .from("videos")
    .select("id, title")
    .eq("id", videoId)
    .single();

  if (videoError || !videoRow) {
    throw new Error(`Could not load video for platform dispatch: ${videoError?.message || "not found"}`);
  }

  const results: Record<string, unknown> = {};
  if (!normalizedPlatforms.includes("vk")) {
    return { success: true, skipped: true, reason: "vk-not-selected" };
  }

  const { data: vkCommunities, error: vkError } = await supabase
    .from("vk_communities")
    .select("id, community_id, community_name, access_token, user_access_token, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (vkError) {
    throw new Error(`Failed to load VK communities: ${vkError.message}`);
  }

  if (!Array.isArray(vkCommunities) || vkCommunities.length === 0) {
    return { success: true, skipped: true, reason: "no-active-vk-communities" };
  }

  const { data: seriesRow, error: seriesError } = await supabase
    .from("video_agent_series")
    .select("series_name, niche_type, selected_niche, custom_niche")
    .eq("id", seriesId)
    .single();

  if (seriesError) {
    throw new Error(`Could not load series for VK publish: ${seriesError.message}`);
  }

  const seriesName = typeof seriesRow?.series_name === "string" ? seriesRow.series_name : "";
  const niche =
    seriesRow?.niche_type === "custom"
      ? typeof seriesRow.custom_niche === "string"
        ? seriesRow.custom_niche
        : ""
      : typeof seriesRow?.selected_niche === "string"
        ? seriesRow.selected_niche
        : "";

  const titleBase = typeof videoRow.title === "string" && videoRow.title.trim()
    ? videoRow.title
    : seriesName || "AI video";
  const title = titleBase.trim();

  const hashtags = buildHashtags(["vkclips", seriesName, niche]);
  const descriptionParts = [] as string[];
  if (seriesName) descriptionParts.push(seriesName);
  if (niche) descriptionParts.push(niche);
  if (hashtags) descriptionParts.push(hashtags);

  const description = descriptionParts.join("\n");

  const perCommunityResults: Array<Record<string, unknown>> = [];
  for (const community of vkCommunities) {
    const communityId =
      typeof community.community_id === "number"
        ? community.community_id
        : Number(community.community_id);
    const accessToken = typeof community.access_token === "string" ? community.access_token : "";
    const userAccessToken =
      typeof community.user_access_token === "string" ? community.user_access_token : "";

    if (!Number.isFinite(communityId) || communityId <= 0 || !accessToken || !userAccessToken) {
      perCommunityResults.push({
        communityId: community.community_id ?? null,
        communityName: community.community_name ?? null,
        success: false,
        error: "Missing community token or user access token",
      });
      continue;
    }

    try {
      const vkResult = await publishVkVideoToCommunity({
        communityToken: accessToken,
        userAccessToken,
        communityId,
        title,
        description,
        videoUrl,
      });
      perCommunityResults.push({
        communityId,
        communityName: community.community_name ?? null,
        success: true,
        result: vkResult,
      });
    } catch (error) {
      perCommunityResults.push({
        communityId,
        communityName: community.community_name ?? null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown VK publish error",
      });
    }
  }

  results.vk = {
    success: perCommunityResults.some((item) => item.success === true),
    total: perCommunityResults.length,
    failures: perCommunityResults.filter((item) => item.success !== true).length,
    communities: perCommunityResults,
  };
  return results;
}

function normalizeCaptionWords(input: unknown): CaptionWord[] {
  if (!Array.isArray(input)) return [];
  const normalized: CaptionWord[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const word = typeof raw.word === "string" ? raw.word.trim() : "";
    const start = typeof raw.start === "number" ? raw.start : Number(raw.start);
    const end = typeof raw.end === "number" ? raw.end : Number(raw.end);
    if (!word || !Number.isFinite(start) || !Number.isFinite(end)) continue;
    normalized.push({
      word,
      start,
      end,
      confidence: typeof raw.confidence === "number" ? raw.confidence : undefined,
    });
  }
  return normalized;
}

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
    const runPublishAfterGeneration =
      event.data && typeof event.data === "object" && event.data.runPublishAfterGeneration === true;

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

    const saveResult = await step.run("save-to-database", async () => {
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

    const renderResult = await step.run("render-mp4-and-save-url", async () => {
      try {
        const supabase = supabaseAdmin();
        const save = saveResult as { videoId?: string | number } | undefined;
        const videoId = save?.videoId ? String(save.videoId) : null;
        const captionRes = captionResult as
          | { captions?: { words?: unknown } }
          | undefined;

        if (!videoId) {
          throw new Error("Missing video ID from save step");
        }

      const { data: series, error: seriesError } = await supabase
        .from("video_agent_series")
        .select("selected_caption_style, step_payload")
        .eq("id", seriesId)
        .single();

      if (seriesError || !series) {
        throw new Error(`Could not load series for render: ${seriesError?.message || "not found"}`);
      }

      const payload = (
        series.step_payload && typeof series.step_payload === "object"
          ? series.step_payload
          : {}
      ) as Record<string, unknown>;

      const images = Array.isArray(payload.scenes_images) ? (payload.scenes_images as string[]) : [];
      const audioUrl = typeof payload.voiceover_url === "string" ? payload.voiceover_url : "";
      const fromCaptionStep = normalizeCaptionWords(captionRes?.captions?.words);
      const fromSeriesPayload = normalizeCaptionWords(payload.captions_words);

      const { data: videoRow, error: videoRowError } = await supabase
        .from("videos")
        .select("captions_words")
        .eq("id", videoId)
        .single();
      if (videoRowError) {
        throw new Error(`Could not load videos row captions for render: ${videoRowError.message}`);
      }
      const fromVideoRow = normalizeCaptionWords(videoRow?.captions_words);

      const captionsWords =
        fromCaptionStep.length > 0
          ? fromCaptionStep
          : fromSeriesPayload.length > 0
            ? fromSeriesPayload
            : fromVideoRow;

      if (!images.length) throw new Error("No scene images available for rendering");
      if (!audioUrl) throw new Error("No voiceover URL available for rendering");
      if (!captionsWords.length) {
        throw new Error(
          `No caption words available for rendering (captionStep=${fromCaptionStep.length}, seriesStepPayload=${fromSeriesPayload.length}, videosRow=${fromVideoRow.length})`,
        );
      }

      const { renderSeriesMp4 } = await import("./remotion/render");
      const { uploadRenderedVideo } = await import("./remotion/upload-video");

      const { outputPath } = await renderSeriesMp4({
        seriesId,
        images,
        audioUrl,
        captionsWords,
        selectedCaptionStyle:
          typeof series.selected_caption_style === "string" ? series.selected_caption_style : null,
      });

      const videoUrl = await uploadRenderedVideo(seriesId, outputPath);

      const { error: updateVideoError } = await supabase
        .from("videos")
        .update({ video_url: videoUrl, status: "rendered", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      if (updateVideoError) {
        throw new Error(`Failed to save video_url: ${updateVideoError.message}`);
      }

      const currentPayload = payload;
      await supabase
        .from("video_agent_series")
        .update({
          status: "rendered",
          step_payload: { ...currentPayload, rendered_video_url: videoUrl },
          updated_at: new Date().toISOString(),
        })
        .eq("id", seriesId);

      await unlink(outputPath).catch(() => undefined);

        return { success: true, videoId, videoUrl };
      } catch (err) {
        console.error("Render MP4 and save URL step failed:", { err, seriesId });
        throw err;
      }
    });

    await step.run("update-series-status", async () => {
      console.log("Updating series status (placeholder)");
      return { success: true };
    });

    await step.run("dispatch-platforms-after-generation", async () => {
      if (!runPublishAfterGeneration) {
        return { success: true, skipped: true };
      }

      const render = renderResult as { videoId?: string | number; videoUrl?: string } | undefined;
      const videoId = render?.videoId ? String(render.videoId) : null;
      const videoUrl = typeof render?.videoUrl === "string" ? render.videoUrl : null;

      if (!videoId || !videoUrl) {
        throw new Error("Missing rendered video details for platform dispatch");
      }

      const result = await dispatchSeriesPlatforms({
        seriesId,
        userId,
        selectedPlatforms: ["vk"],
        videoId,
        videoUrl,
      });

      return { success: true, result };
    });

    return {
      success: true,
      seriesId,
      scriptTitle: scriptData.title,
      sceneCount: scriptData.scenes.length,
    };
  }
);
