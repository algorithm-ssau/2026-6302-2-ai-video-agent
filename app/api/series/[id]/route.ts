import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { isValidSeriesPayload } from "@/lib/series"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const supabase = supabaseAdmin()

  const { data, error } = await supabase
    .from("video_agent_series")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ series: data })
}

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const body: unknown = await request.json().catch(() => null)
  const supabase = supabaseAdmin()

  if (
    body &&
    typeof body === "object" &&
    "action" in body &&
    typeof body.action === "string"
  ) {
    const { data: existing, error: fetchError } = await supabase
      .from("video_agent_series")
      .select("step_payload")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const currentPayload =
      existing?.step_payload && typeof existing.step_payload === "object"
        ? (existing.step_payload as Record<string, unknown>)
        : {}

    if (body.action === "pause" || body.action === "resume") {
      const isPaused = body.action === "pause"
      const { error } = await supabase
        .from("video_agent_series")
        .update({
          step_payload: {
            ...currentPayload,
            isPaused,
          },
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    if (body.action === "trigger") {
      const { error } = await supabase
        .from("video_agent_series")
        .update({
          status: "processing",
          step_payload: {
            ...currentPayload,
            isPaused: false,
            lastTriggeredAt: new Date().toISOString(),
          },
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
  }

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

  const selectedBGMeta = Array.isArray(body.selectedBGMeta) ? body.selectedBGMeta : []

  const { data, error } = await supabase
    .from("video_agent_series")
    .update({
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
      step_payload: body,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}

export async function DELETE(_: Request, context: RouteContext) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const supabase = supabaseAdmin()

  const { error } = await supabase
    .from("video_agent_series")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
