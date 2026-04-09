import Replicate from "replicate";
import { supabaseAdmin } from "./supabase/admin";
import { getReplicateToken } from "./env";
import { VideoScript } from "./video-script-generator";

export async function generateImagesForScript(seriesId: string, script: VideoScript) {
  const token = getReplicateToken();
  const replicate = new Replicate({ auth: token });

  const model = "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe";

  const supabase = supabaseAdmin();

  const savedUrls: string[] = [];

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const prompt = scene.imagePrompt || "";

    // Run replicate model
    const input = { prompt };
    const output = await replicate.run(model, { input }).catch((err) => {
      throw new Error(`Replicate image generation failed for scene ${i + 1}: ${String(err)}`);
    });

    // output can be array of urls or objects -- normalize
    let url: string | null = null;
    if (Array.isArray(output) && output.length > 0) {
      const first = output[0] as unknown;
      if (typeof first === "string") {
        url = first;
      } else if (first && typeof first === "object") {
        const obj = first as Record<string, unknown>;
        const maybeUrl = obj.url;
        if (typeof maybeUrl === "function") {
          try {
            // call function that may return a Promise<string>
            const res = (maybeUrl as unknown) as (() => Promise<string> | string);
            const val = res();
            url = typeof val === "string" ? val : await val;
          } catch {
            url = String(maybeUrl);
          }
        } else if (typeof maybeUrl === "string") {
          url = maybeUrl;
        }
      }
    } else if (typeof output === "string") {
      url = output;
    }

    if (!url) throw new Error(`Unable to determine replicate output URL for scene ${i + 1}`);

    // Save into a simple assets table (video_agent_assets)
    const { error } = await supabase
      .from("video_agent_assets")
      .insert([
        {
          series_id: seriesId,
          scene_number: i + 1,
          image_url: url,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      throw new Error(`Failed to insert asset row: ${error.message}`);
    }

    savedUrls.push(url);
  }

  // Also update step_payload.scenes_images with array of urls
  const { data: existing } = await supabase.from("video_agent_series").select("step_payload").eq("id", seriesId).single();
  const currentPayload = existing?.step_payload && typeof existing.step_payload === "object" ? existing.step_payload as Record<string, unknown> : {};
  await supabase
    .from("video_agent_series")
    .update({ step_payload: { ...currentPayload, scenes_images: savedUrls }, updated_at: new Date().toISOString() })
    .eq("id", seriesId);

  return savedUrls;
}
