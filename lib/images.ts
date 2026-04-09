import { supabaseAdmin } from "./supabase/admin";
import { getHuggingFaceKey } from "./env";
import { VideoScript } from "./video-script-generator";

// Generate images using Hugging Face Inference API and upload results to Supabase Storage.
export async function generateImagesForScript(seriesId: string, script: VideoScript) {
  const supabase = supabaseAdmin();

  // load current series payload so we can update it on partial failures
  const { data: existing } = await supabase.from("video_agent_series").select("step_payload").eq("id", seriesId).single();
  const currentPayload = existing?.step_payload && typeof existing.step_payload === "object" ? (existing.step_payload as Record<string, unknown>) : {};

  const savedUrls: string[] = [];

  const hfKey = getHuggingFaceKey();

  // Use the new InferenceClient (JS SDK). Avoid HfInference which is deprecated.
  async function callHfImage(prompt: string): Promise<{ url: string } | { error: string } | null> {
    const models = ["black-forest-labs/FLUX.1-schnell", "stabilityai/stable-diffusion-xl-base-1.0"];

    // Minimal client typing we expect from the SDK
    type HfResponseLike = { arrayBuffer: () => Promise<ArrayBuffer> };
    type HfClientLike = {
      textToImage: (opts: { model: string; inputs: string; parameters?: Record<string, unknown> }) => Promise<HfResponseLike>;
    };

    // Dynamically import to avoid runtime errors when package isn't installed during build
    const mod = await import("@huggingface/inference");
    const InferenceClientCtor = (mod as unknown as { InferenceClient: new (token?: string | { token?: string }) => unknown }).InferenceClient;
    const client = new InferenceClientCtor(hfKey) as unknown as HfClientLike;

    for (const model of models) {
      try {
        const response = await client.textToImage({ model, inputs: prompt, parameters: { guidance_scale: 3.5 } });
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const bucket = "images";
        const path = `series/${seriesId}/images/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, { contentType: "image/png", upsert: true });
        if (uploadError) {
          return { error: String(uploadError) };
        }
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
        return { url: publicData.publicUrl };
      } catch (e) {
        // If model fails (loading, rate limit, etc.), try next model.
        // Continue to next candidate model.
        continue;
      }
    }
    return null;
  }

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const prompt = scene.imagePrompt || "";

    const result = await callHfImage(prompt);
    if (!result || "error" in result) {
      const errMsg = `Hugging Face did not produce image for scene ${i + 1}` + (result && "error" in result ? `: ${result.error}` : "");
      try {
        await supabase.from("video_agent_series").update({ step_payload: { ...currentPayload, scenes_images: savedUrls, hf_image_error: errMsg }, updated_at: new Date().toISOString() }).eq("id", seriesId);
      } catch {}
      throw new Error(errMsg);
    }

    savedUrls.push(result.url);
  }

  // Also update step_payload.scenes_images with array of urls
  await supabase.from("video_agent_series").update({ step_payload: { ...currentPayload, scenes_images: savedUrls }, updated_at: new Date().toISOString() }).eq("id", seriesId);

  return savedUrls;
}
