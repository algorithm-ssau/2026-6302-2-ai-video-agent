import { supabaseAdmin } from "@/lib/supabase/admin"

export type VideoListRow = {
  id: string | number
  series_id: string | number | null
  title: string | null
  status: string | null
  video_url: string | null
  images: unknown
  created_at: string | null
  duration_seconds: number | null
  scene_count: number | null
}

export async function listVideosForUser(
  userId: string,
  options?: { seriesId?: string | null },
): Promise<{ videos: VideoListRow[]; error: string | null }> {
  const supabase = supabaseAdmin()
  let query = supabase
    .from("videos")
    .select(
      "id, series_id, title, status, video_url, images, created_at, duration_seconds, scene_count",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const sid = options?.seriesId?.trim()
  if (sid) {
    const asNum = Number(sid)
    if (!Number.isNaN(asNum) && Number.isFinite(asNum)) {
      query = query.eq("series_id", asNum)
    } else {
      query = query.eq("series_id", sid)
    }
  }

  const { data, error } = await query

  if (error) {
    return { videos: [], error: error.message }
  }

  return { videos: (data ?? []) as VideoListRow[], error: null }
}

