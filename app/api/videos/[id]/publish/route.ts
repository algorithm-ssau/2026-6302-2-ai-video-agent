import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { publishVkVideoToCommunity } from "@/lib/social/vk"
import { buildHashtags } from "@/lib/social/build-hashtags"
import { supabaseAdmin } from "@/lib/supabase/admin"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { data: videoRow, error: videoError } = await supabase
      .from("videos")
      .select("id, series_id, title, status, video_url")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (videoError || !videoRow) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (videoRow.status !== "rendered" || !videoRow.video_url) {
      return NextResponse.json(
        { error: "Video is not ready for publish. Render must be completed first." },
        { status: 400 },
      )
    }

    const { data: vkCommunities, error: communitiesError } = await supabase
      .from("vk_communities")
      .select("community_id, community_name, access_token, user_access_token")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (communitiesError) {
      return NextResponse.json({ error: communitiesError.message }, { status: 500 })
    }

    if (!Array.isArray(vkCommunities) || vkCommunities.length === 0) {
      return NextResponse.json(
        { error: "No active VK communities found in Settings" },
        { status: 400 },
      )
    }

    const { data: seriesRow } = await supabase
      .from("video_agent_series")
      .select("series_name, niche_type, selected_niche, custom_niche")
      .eq("id", videoRow.series_id)
      .single()

    const seriesName = typeof seriesRow?.series_name === "string" ? seriesRow.series_name : ""
    const niche =
      seriesRow?.niche_type === "custom"
        ? typeof seriesRow.custom_niche === "string"
          ? seriesRow.custom_niche
          : ""
        : typeof seriesRow?.selected_niche === "string"
          ? seriesRow.selected_niche
          : ""

    const titleBase =
      typeof videoRow.title === "string" && videoRow.title.trim()
        ? videoRow.title
        : seriesName || "AI video"
    const title = titleBase.trim()

    const hashtags = buildHashtags(["vkclips", seriesName, niche])
    const descriptionParts = [] as string[]
    if (seriesName) descriptionParts.push(seriesName)
    if (niche) descriptionParts.push(niche)
    if (hashtags) descriptionParts.push(hashtags)
    const description = descriptionParts.join("\n")

    const communities: Array<Record<string, unknown>> = []
    for (const community of vkCommunities) {
      const communityId =
        typeof community.community_id === "number"
          ? community.community_id
          : Number(community.community_id)
      const accessToken = typeof community.access_token === "string" ? community.access_token : ""
      const userAccessToken =
        typeof community.user_access_token === "string" ? community.user_access_token : ""

      if (!Number.isFinite(communityId) || communityId <= 0 || !accessToken || !userAccessToken) {
        communities.push({
          communityId: community.community_id ?? null,
          communityName: community.community_name ?? null,
          success: false,
          error: "Missing community token or user access token",
        })
        continue
      }

      try {
        const result = await publishVkVideoToCommunity({
          communityToken: accessToken,
          userAccessToken,
          communityId,
          title,
          description,
          videoUrl: videoRow.video_url,
        })
        communities.push({
          communityId,
          communityName: community.community_name ?? null,
          success: true,
          result,
        })
      } catch (error) {
        communities.push({
          communityId,
          communityName: community.community_name ?? null,
          success: false,
          error: error instanceof Error ? error.message : "Unknown VK publish error",
        })
      }
    }

    const failuresList = communities.filter((item) => item.success !== true)
    const failures = failuresList.length
    const success = communities.some((item) => item.success === true)
    const firstFailure = failuresList[0]
    const firstFailureMessage =
      firstFailure && typeof firstFailure.error === "string"
        ? firstFailure.error
        : "Unknown publish error"

    return NextResponse.json({
      ok: success,
      total: communities.length,
      failures,
      message: success
        ? `Published to ${Math.max(0, communities.length - failures)}/${communities.length} communities`
        : `Published to 0/${communities.length} communities: ${firstFailureMessage}`,
      communities,
    })
  } catch (error) {
    console.error("Unexpected error in POST /api/videos/[id]/publish:", error)
    return NextResponse.json({ error: "Failed to publish video" }, { status: 500 })
  }
}
