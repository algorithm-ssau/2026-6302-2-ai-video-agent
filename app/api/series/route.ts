import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"

type SeriesPayload = {
  nicheType: "available" | "custom"
  selectedNiche: string | null
  customNiche: string
  language: string | null
  languageModel: string | null
  voice: string | null
  selectedBG: string[]
  selectedBGMeta?: Array<{ id: string; title: string; url: string }>
  selectedStyle: string | null
  selectedCaptionStyle: string | null
  seriesName: string
  duration: string
  selectedPlatforms: string[]
  publishTime: string
}

function isValidPayload(payload: unknown): payload is SeriesPayload {
  if (!payload || typeof payload !== "object") return false

  const data = payload as Record<string, unknown>

  return (
    (data.nicheType === "available" || data.nicheType === "custom") &&
    (data.selectedNiche === null || typeof data.selectedNiche === "string") &&
    typeof data.customNiche === "string" &&
    (data.language === null || typeof data.language === "string") &&
    (data.languageModel === null || typeof data.languageModel === "string") &&
    (data.voice === null || typeof data.voice === "string") &&
    Array.isArray(data.selectedBG) &&
    Array.isArray(data.selectedPlatforms) &&
    (data.selectedStyle === null || typeof data.selectedStyle === "string") &&
    (data.selectedCaptionStyle === null ||
      typeof data.selectedCaptionStyle === "string") &&
    typeof data.seriesName === "string" &&
    typeof data.duration === "string" &&
    typeof data.publishTime === "string"
  )
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const seriesName = body.seriesName.trim()
  const customNiche = body.customNiche.trim()
  const publishTime = body.publishTime.trim()

  if (!seriesName) {
    return NextResponse.json(
      { error: "Series name is required" },
      { status: 400 },
    )
  }

  if (!publishTime) {
    return NextResponse.json(
      { error: "Publish time is required" },
      { status: 400 },
    )
  }

  if (body.nicheType === "available" && !body.selectedNiche) {
    return NextResponse.json(
      { error: "Selected niche is required" },
      { status: 400 },
    )
  }

  if (body.nicheType === "custom" && !customNiche) {
    return NextResponse.json(
      { error: "Custom niche is required" },
      { status: 400 },
    )
  }

  if (!body.language || !body.voice) {
    return NextResponse.json(
      { error: "Language and voice are required" },
      { status: 400 },
    )
  }

  if (!body.selectedStyle) {
    return NextResponse.json(
      { error: "Video style is required" },
      { status: 400 },
    )
  }

  if (!body.selectedCaptionStyle) {
    return NextResponse.json(
      { error: "Caption style is required" },
      { status: 400 },
    )
  }

  const supabase = supabaseAdmin()
  const selectedBGMeta = Array.isArray(body.selectedBGMeta) ? body.selectedBGMeta : []

  const { data, error } = await supabase
    .from("video_agent_series")
    .insert({
      user_id: userId,
      niche_type: body.nicheType,
      selected_niche: body.selectedNiche,
      custom_niche: customNiche || null,
      language: body.language,
      language_model: body.languageModel,
      voice: body.voice,
      selected_bg: body.selectedBG,
      selected_bg_meta: selectedBGMeta,
      selected_style: body.selectedStyle,
      selected_caption_style: body.selectedCaptionStyle,
      series_name: seriesName,
      duration: body.duration,
      selected_platforms: body.selectedPlatforms,
      publish_time: publishTime,
      status: "scheduled",
      step_payload: body,
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
