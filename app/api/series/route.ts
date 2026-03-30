import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { isValidSeriesPayload } from "@/lib/series"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from("video_agent_series")
    .select(
      "id, series_name, selected_style, status, created_at, updated_at, publish_time, selected_platforms, step_payload",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ series: data })
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)

  if (!isValidSeriesPayload(body)) {
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
      status: "active",
      step_payload: body,
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
