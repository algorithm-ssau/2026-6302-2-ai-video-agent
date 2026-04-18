import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { redirect } from "next/navigation"

import { listVideosForUser } from "@/lib/videos-list"

import { VideosClient } from "./videos-client"

type VideosPageProps = {
  searchParams: Promise<{ seriesId?: string; generating?: string }>
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const params = await searchParams
  const seriesId = params.seriesId?.trim() || null
  const generating = params.generating === "1" || params.generating === "true"

  const { videos, error } = await listVideosForUser(userId, {
    seriesId: seriesId ?? undefined,
  })

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Generated videos</h1>
        <p className="mt-4 text-red-600">{error}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-violet-600 underline hover:text-violet-500"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <VideosClient
      initialVideos={videos}
      initialSeriesId={seriesId}
      initialGenerating={generating}
    />
  )
}
