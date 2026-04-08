import { generateVideoScript, type VideoScript } from "../video-script-generator";
import { supabaseAdmin } from "../supabase/admin";

export async function generateVideoScriptStep(seriesId: string, userId: string): Promise<VideoScript> {
  const supabase = supabaseAdmin();
  
  const { data: series, error: seriesError } = await supabase
    .from("video_agent_series")
    .select("*")
    .eq("id", seriesId)
    .eq("user_id", userId)
    .single();

  if (seriesError || !series) {
    throw new Error(`Failed to fetch series: ${seriesError?.message}`);
  }

  const stepPayload = series.step_payload as Record<string, unknown> || {};
  
  const niche = series.niche_type === "custom" 
    ? series.custom_niche 
    : series.selected_niche;

  const scriptData = await generateVideoScript({
    seriesName: series.series_name,
    niche: niche || "general",
    language: series.language || "English",
    duration: series.duration || "30-40",
    style: series.selected_style || "default",
  });

  await supabase
    .from("video_agent_series")
    .update({
      status: "processing",
      step_payload: {
        ...stepPayload,
        scriptData: scriptData,
        scriptGeneratedAt: new Date().toISOString(),
      },
    })
    .eq("id", seriesId);

  return scriptData;
}
