import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { listVideosForUser } from "@/lib/videos-list"

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const seriesIdParam = searchParams.get("seriesId")

    const { videos, error } = await listVideosForUser(userId, {
      seriesId: seriesIdParam ?? undefined,
    })

    if (error) {
      console.error("Failed to list videos:", error)
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Unexpected error in GET /api/videos:", error)
    return NextResponse.json({ error: "Failed to load videos" }, { status: 500 })
  }
}

