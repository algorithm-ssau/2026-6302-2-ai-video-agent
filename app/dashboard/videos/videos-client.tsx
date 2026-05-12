"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import type { VideoListRow } from "@/lib/videos-list"

const createdAtFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

const POLL_MS = 3000
const MAX_WAIT_MS = 15 * 60 * 1000

function thumbnailUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null
  const first = images[0]
  return typeof first === "string" && first.length > 0 ? first : null
}

function videoStatusBadge(status: string | null) {
  const s = (status || "unknown").toLowerCase()
  if (s === "generated" || s === "completed" || s === "rendered") return "bg-teal-100 text-teal-800"
  if (s === "processing" || s === "pending") return "bg-blue-100 text-blue-700"
  if (s === "failed") return "bg-red-100 text-red-700"
  return "bg-slate-100 text-slate-700"
}

function getVideoStatusLabel(status: string | null): string {
  const s = (status || "unknown").toLowerCase()
  if (s === "rendered") return "Готово"
  if (s === "generated" || s === "completed") return "Завершено"
  if (s === "processing" || s === "pending") return "Обработка"
  if (s === "failed") return "Ошибка"
  return "Неизвестно"
}

type SeriesApiRow = {
  id: number
  status: string
}

function GeneratingPlaceholderCard({ seriesId }: { seriesId: string }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[9/16] overflow-hidden bg-slate-100">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <Loader2 className="size-3 animate-spin" />
            Генерация
          </span>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
        <p className="text-sm text-slate-500">Создание вашего видео…</p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">Серия:</span> #{seriesId}
        </p>
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    </article>
  )
}

type VideosClientProps = {
  initialVideos: VideoListRow[]
  initialSeriesId: string | null
  initialGenerating: boolean
}

export function VideosClient({
  initialVideos,
  initialSeriesId,
  initialGenerating,
}: VideosClientProps) {
  const router = useRouter()
  const [videos, setVideos] = useState<VideoListRow[]>(() => initialVideos)
  const [listError, setListError] = useState<string | null>(null)
  const [generatingBanner, setGeneratingBanner] = useState(
    initialGenerating && Boolean(initialSeriesId),
  )
  const [generatingTimedOut, setGeneratingTimedOut] = useState(false)
  const [pollNote, setPollNote] = useState<string | null>(null)
  const [publishingVideoId, setPublishingVideoId] = useState<string | null>(null)
  const [publishNotes, setPublishNotes] = useState<Record<string, string>>({})
  const startedAtRef = useRef<number | null>(null)

  const seriesId = initialSeriesId

  useEffect(() => {
    setVideos(initialVideos)
  }, [initialVideos])

  const refetchVideos = useCallback(async () => {
    setListError(null)
    try {
      const qs = seriesId ? `?seriesId=${encodeURIComponent(seriesId)}` : ""
      const res = await fetch(`/api/videos${qs}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Не удалось загрузить видео")
      }
      setVideos(Array.isArray(data.videos) ? data.videos : [])
      } catch (e) {
        setListError(e instanceof Error ? e.message : "Неизвестная ошибка")
      }
  }, [seriesId])

  useEffect(() => {
    if (!initialGenerating || !seriesId) return

    setGeneratingTimedOut(false)
    setPollNote(null)
    startedAtRef.current = Date.now()

    const tick = async () => {
      if (startedAtRef.current != null) {
        if (Date.now() - startedAtRef.current > MAX_WAIT_MS) {
           setGeneratingTimedOut(true)
           setGeneratingBanner(false)
           setPollNote(
             "Генерация занимает больше времени, чем ожидалось, или она могла завершиться с ошибкой. Проверьте статус на странице серии.",
           )
           return true
        }
      }

      try {
        const res = await fetch(`/api/series/${seriesId}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setPollNote(data.error || "Не удалось проверить статус генерации.")
          return true
        }
         const series = data.series as SeriesApiRow | undefined
         if (!series) {
           setPollNote("Серия не найдена.")
           return true
         }
        if (series.status !== "processing") {
          setGeneratingBanner(false)
          setPollNote(null)
          setGeneratingTimedOut(false)
          await refetchVideos()
          const next = seriesId
            ? `/dashboard/videos?seriesId=${encodeURIComponent(seriesId)}`
            : "/dashboard/videos"
          router.replace(next)
          return true
        }
      } catch {
        setPollNote("Не удалось проверить статус генерации.")
      }
      return false
    }

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | undefined

    void (async () => {
      const done = await tick()
      if (done || cancelled) return
      intervalId = setInterval(async () => {
        const finished = await tick()
        if (finished && intervalId) clearInterval(intervalId)
      }, POLL_MS)
    })()

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [initialGenerating, seriesId, refetchVideos, router])

  const publishVideo = useCallback(async (videoId: string) => {
    if (publishingVideoId) return
    setPublishingVideoId(videoId)
    setPublishNotes((prev) => ({ ...prev, [videoId]: "" }))
    try {
      const res = await fetch(`/api/videos/${encodeURIComponent(videoId)}/publish`, {
        method: "POST",
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        total?: number
        failures?: number
        message?: string
        communities?: Array<{ success?: boolean; error?: string; communityName?: string | null; communityId?: number | null }>
      }
      if (!res.ok) {
        throw new Error(data.error || "Не удалось опубликовать видео")
      }

      const total = typeof data.total === "number" ? data.total : 0
      const failures = typeof data.failures === "number" ? data.failures : 0
      const successCount = Math.max(0, total - failures)
      const firstFailedCommunity = Array.isArray(data.communities)
        ? data.communities.find((item) => item?.success !== true)
        : null
      const firstFailureMessage =
        firstFailedCommunity && typeof firstFailedCommunity.error === "string"
          ? firstFailedCommunity.error
          : null
      const failureTarget =
        firstFailedCommunity && (firstFailedCommunity.communityName || firstFailedCommunity.communityId)
          ? String(firstFailedCommunity.communityName || firstFailedCommunity.communityId)
          : null
       setPublishNotes((prev) => ({
         ...prev,
         [videoId]:
           failures > 0
             ? `Опубликовано в ${successCount}/${total} сообществ${firstFailureMessage ? `. Первая ошибка${failureTarget ? ` (${failureTarget})` : ""}: ${firstFailureMessage}` : ""}`
             : (data.message || `Опубликовано в ${successCount}/${total} сообществ`),
       }))
    } catch (error) {
      setPublishNotes((prev) => ({
        ...prev,
        [videoId]: error instanceof Error ? error.message : "Не удалось опубликовать"
      }))
    } finally {
      setPublishingVideoId(null)
    }
  }, [publishingVideoId])

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-violet-50 to-amber-50 p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Сгенерированные видео
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              {seriesId
                ? `Показаны видео для серии #${seriesId}.`
                : "Все видео, созданные из ваших серий."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {seriesId ? (
              <Link
                href="/dashboard/videos"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Показать все видео
              </Link>
            ) : null}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500"
            >
              Назад к сериям
            </Link>
          </div>
        </div>

        {generatingBanner && seriesId ? (
          <div
            className="mt-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-5 shrink-0 animate-spin" />
            <p className="text-sm font-medium">
              Генерация видео для этой серии… Это может занять несколько минут.
            </p>
          </div>
        ) : null}

        {generatingTimedOut || pollNote ? (
          <p className="mt-4 text-sm text-amber-800">{pollNote}</p>
        ) : null}

        {listError ? (
          <p className="mt-4 text-sm text-red-600">{listError}</p>
        ) : null}
      </div>

      <section>
        <h2 className="mb-5 text-2xl font-semibold text-slate-900">
          {videos.length + (generatingBanner && seriesId ? 1 : 0)} видео
        </h2>

        {videos.length === 0 && !(generatingBanner && seriesId) ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-xl font-semibold text-slate-900">Видео пока нет</h3>
            <p className="mt-2 text-slate-500">
              Сгенерируйте видео из серии, чтобы оно отобразилось здесь.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              Перейти к сериям
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {generatingBanner && seriesId ? (
              <GeneratingPlaceholderCard seriesId={seriesId} />
            ) : null}
            {videos.map((v) => {
              const thumb = thumbnailUrl(v.images)
              const created = v.created_at
                ? createdAtFormatter.format(new Date(v.created_at))
                : "—"
               const title = v.title?.trim() || "Без названия"
              const sid = v.series_id != null ? String(v.series_id) : "—"
              const videoUrl = typeof v.video_url === "string" ? v.video_url : null
              const status = (v.status || "").toLowerCase()
              const canPublish = Boolean(videoUrl) && status === "rendered"
              const cardId = String(v.id)
              const isPublishing = publishingVideoId === cardId
              const publishNote = publishNotes[cardId]

              return (
                <article
                  key={String(v.id)}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[9/16] overflow-hidden bg-slate-100">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote URLs without next/image config
                      <img src={thumb} alt="" className="size-full object-cover" />
                    ) : (
                      <Image
                        src="/logo.png"
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-contain p-8"
                      />
                    )}
                    <div className="absolute left-4 top-4">
                       <span
                         className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${videoStatusBadge(v.status)}`}
                       >
                         {getVideoStatusLabel(v.status)}
                       </span>
                    </div>
                  </div>
                  <div className="space-y-2 p-5">
                     <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">
                       {title}
                     </h3>
                     <p className="text-sm text-slate-500">Создано {created}</p>
                     <p className="text-sm text-slate-600">
                       <span className="font-medium text-slate-900">Серия:</span>{" "}
                      #{sid}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      {v.duration_seconds != null ? (
                        <span>
                          <span className="font-medium text-slate-900">
                            Длительность:
                          </span>{" "}
                          {v.duration_seconds}s
                        </span>
                      ) : null}
                      {v.scene_count != null ? (
                        <span>
                          <span className="font-medium text-slate-900">Сцены:</span>{" "}
                          {v.scene_count}
                        </span>
                      ) : null}
                    </div>
                    {videoUrl ? (
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Открыть MP4
                          </a>
                          {canPublish ? (
                            <button
                              type="button"
                              onClick={() => void publishVideo(cardId)}
                              disabled={isPublishing}
                              className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPublishing ? "Публикация…" : "Опубликовать"}
                            </button>
                          ) : null}
                        </div>
                        {publishNote ? (
                          <p className="pt-2 text-sm text-slate-500">{publishNote}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="pt-2 text-sm text-slate-500">MP4 рендерится…</p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

