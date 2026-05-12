import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { isValidSeriesPayload } from "@/lib/series"
import { inngest } from "@/lib/inngest-client"

function normalizePublishTime(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString()
}

export async function GET() {
  try {
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
      console.error("Failed to list series:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ series: data })
  } catch (error) {
    console.error("Unexpected error in GET /api/series:", error)
    return NextResponse.json({ error: "Failed to load series" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: unknown = await request.json().catch(() => null)

    if (!isValidSeriesPayload(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const normalizedPayload = { ...body, selectedPlatforms: ["vk"] as const }
    const seriesName = normalizedPayload.seriesName.trim()
    const customNiche = normalizedPayload.customNiche.trim()
    const publishTime = normalizedPayload.publishTime.trim()
    const publishTimeUtc = normalizePublishTime(publishTime)

    if (!seriesName) {
      return NextResponse.json(
        { error: "Series name is required" },
        { status: 400 },
      )
    }

    if (!publishTimeUtc) {
      return NextResponse.json(
        { error: "Publish time is required" },
        { status: 400 },
      )
    }

    if (normalizedPayload.nicheType === "available" && !normalizedPayload.selectedNiche) {
      return NextResponse.json(
        { error: "Selected niche is required" },
        { status: 400 },
      )
    }

    if (normalizedPayload.nicheType === "custom" && !customNiche) {
      return NextResponse.json(
        { error: "Custom niche is required" },
        { status: 400 },
      )
    }

    if (!normalizedPayload.language || !normalizedPayload.voice) {
      return NextResponse.json(
        { error: "Language and voice are required" },
        { status: 400 },
      )
    }

    if (!normalizedPayload.selectedStyle) {
      return NextResponse.json(
        { error: "Video style is required" },
        { status: 400 },
      )
    }

    if (!normalizedPayload.selectedCaptionStyle) {
      return NextResponse.json(
        { error: "Caption style is required" },
        { status: 400 },
      )
    }

    const supabase = supabaseAdmin()
    const selectedBGMeta = Array.isArray(normalizedPayload.selectedBGMeta)
      ? normalizedPayload.selectedBGMeta
      : []
    const payloadForSave = { ...normalizedPayload, publishTime: publishTimeUtc }

    const { data, error } = await supabase
      .from("video_agent_series")
      .insert({
        user_id: userId,
        niche_type: normalizedPayload.nicheType,
        selected_niche: normalizedPayload.selectedNiche,
        custom_niche: customNiche || null,
        language: normalizedPayload.language,
        language_model: normalizedPayload.languageModel,
        voice: normalizedPayload.voice,
        selected_bg: normalizedPayload.selectedBG,
        selected_bg_meta: selectedBGMeta,
        selected_style: normalizedPayload.selectedStyle,
        selected_caption_style: normalizedPayload.selectedCaptionStyle,
        series_name: seriesName,
        duration: normalizedPayload.duration,
        selected_platforms: normalizedPayload.selectedPlatforms,
        publish_time: publishTimeUtc,
        status: "processing",
        step_payload: payloadForSave,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to create series:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      await inngest.send({
        name: "video/generate",
        data: {
          seriesId: String(data.id),
          userId,
          runPublishAfterGeneration: false,
        },
      })
    } catch (triggerError) {
      console.error("Failed to trigger generation after series create:", triggerError)
    }

    return NextResponse.json({ ok: true, id: data.id })
  } catch (error) {
    console.error("Unexpected error in POST /api/series:", error)
    return NextResponse.json({ error: "Failed to create series" }, { status: 500 })
  }
}
