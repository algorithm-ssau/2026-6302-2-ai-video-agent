"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import {
  Edit3,
  MoreHorizontal,
  Pause,
  Play,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSeriesStyleThumbnail } from "@/lib/series"

type SeriesRecord = {
  id: number
  series_name: string
  selected_style: string | null
  status: string
  created_at: string
  updated_at: string
  publish_time: string | null
  selected_platforms: string[]
  step_payload?: {
    isPaused?: boolean
  } | null
}

const createdAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function getDisplayStatus(series: SeriesRecord) {
  if (series.step_payload?.isPaused) return "Paused"
  if (series.status === "active") return "Active"
  if (series.status === "processing") return "Processing"
  if (series.status === "completed") return "Completed"
  if (series.status === "failed") return "Failed"
  if (series.status === "cancelled") return "Cancelled"
  return "Active"
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Paused":
      return "bg-amber-100 text-amber-800"
    case "Processing":
      return "bg-blue-100 text-blue-700"
    case "Active":
      return "bg-emerald-100 text-emerald-700"
    case "Completed":
      return "bg-teal-100 text-teal-700"
    case "Failed":
      return "bg-red-100 text-red-700"
    case "Cancelled":
      return "bg-slate-200 text-slate-700"
    default:
      return "bg-violet-100 text-violet-700"
  }
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [synced, setSynced] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [series, setSeries] = useState<SeriesRecord[]>([])
  const [seriesError, setSeriesError] = useState<string | null>(null)
  const [isLoadingSeries, setIsLoadingSeries] = useState(false)
  const [actionSeriesId, setActionSeriesId] = useState<number | null>(null)

  useEffect(() => {
    if (!isLoaded || !user || synced) return

    const run = async () => {
      try {
        const res = await fetch("/api/sync-user", {
          method: "POST",
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Failed to sync user")
        }

        setSynced(true)
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    void run()
  }, [isLoaded, user, synced])

  useEffect(() => {
    if (!isLoaded || !user) return

    const loadSeries = async () => {
      setIsLoadingSeries(true)
      setSeriesError(null)

      try {
        const res = await fetch("/api/series", {
          method: "GET",
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Failed to load series")
        }

        const data = await res.json()
        setSeries(Array.isArray(data.series) ? data.series : [])
      } catch (err) {
        setSeriesError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoadingSeries(false)
      }
    }

    void loadSeries()
  }, [isLoaded, user])

  async function handleSeriesAction(
    id: number,
    action: "pause" | "resume" | "trigger" | "delete",
  ) {
    if (actionSeriesId !== null) return

    const confirmed =
      action !== "delete" ||
      window.confirm("Delete this series? This action cannot be undone.")

    if (!confirmed) return

    setActionSeriesId(id)
    setSeriesError(null)

    try {
      const res = await fetch(`/api/series/${id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers:
          action === "delete"
            ? undefined
            : {
                "Content-Type": "application/json",
              },
        body: action === "delete" ? undefined : JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${action} series`)
      }

      if (action === "delete") {
        setSeries((current) => current.filter((item) => item.id !== id))
        return
      }

      setSeries((current) =>
        current.map((item) => {
          if (item.id !== id) return item

          if (action === "pause") {
            return {
              ...item,
              step_payload: {
                ...(item.step_payload ?? {}),
                isPaused: true,
              },
            }
          }

          if (action === "resume") {
            return {
              ...item,
              status: "active",
              step_payload: {
                ...(item.step_payload ?? {}),
                isPaused: false,
              },
            }
          }

          return {
            ...item,
            status: "processing",
            step_payload: {
              ...(item.step_payload ?? {}),
              isPaused: false,
            },
          }
        }),
      )
    } catch (err) {
      setSeriesError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setActionSeriesId(null)
    }
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Sign in to open your dashboard.</p>
      </main>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-violet-50 to-amber-50 p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Your video agent series
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Welcome back, {user.fullName || user.primaryEmailAddress?.emailAddress}.
              Manage scheduled series, jump into edits, and trigger new generations.
            </p>
          </div>

          <Link
            href="/dashboard/create"
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500"
          >
            Create new series
          </Link>
        </div>

        {syncError && (
          <p className="mt-4 text-sm text-red-600">
            Failed to sync your profile: {syncError}
          </p>
        )}
        {!syncError && synced && (
          <p className="mt-4 text-sm text-emerald-600">
            Your profile is synced and series are ready to manage.
          </p>
        )}
        {seriesError && (
          <p className="mt-2 text-sm text-red-600">{seriesError}</p>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Created series</h2>
            <p className="text-sm text-slate-500">
              {series.length} total series
            </p>
          </div>
        </div>

        {isLoadingSeries ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Loading your series...
          </div>
        ) : series.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-xl font-semibold text-slate-900">
              No series created yet
            </h3>
            <p className="mt-2 text-slate-500">
              Create your first series and it will appear here with management actions.
            </p>
            <Link
              href="/dashboard/create"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              Create first series
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {series.map((item) => {
              const displayStatus = getDisplayStatus(item)
              const isPaused = item.step_payload?.isPaused === true
              const isBusy = actionSeriesId === item.id
              const platforms =
                Array.isArray(item.selected_platforms) &&
                item.selected_platforms.length > 0
                  ? item.selected_platforms.join(", ")
                  : "No platforms selected"

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative">
                    <div className="relative aspect-[9/16] overflow-hidden bg-slate-100">
                      <Image
                        src={getSeriesStyleThumbnail(item.selected_style)}
                        alt={item.series_name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/10" />
                    </div>

                    <div className="absolute left-4 top-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(displayStatus)}`}
                      >
                        {displayStatus}
                      </span>
                    </div>

                    <div className="absolute right-4 top-4 flex items-center gap-2">
                      <Link
                        href={`/dashboard/create?seriesId=${item.id}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                        aria-label={`Edit ${item.series_name}`}
                      >
                        <Edit3 className="size-4" />
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                            aria-label={`Open options for ${item.series_name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/create?seriesId=${item.id}`}>
                              <Edit3 className="size-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              void handleSeriesAction(
                                item.id,
                                isPaused ? "resume" : "pause",
                              )
                            }
                            disabled={isBusy}
                          >
                            {isPaused ? (
                              <Play className="size-4" />
                            ) : (
                              <Pause className="size-4" />
                            )}
                            {isPaused ? "Resume series" : "Pause series"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => void handleSeriesAction(item.id, "delete")}
                            disabled={isBusy}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="line-clamp-1 text-xl font-semibold text-slate-900">
                        {item.series_name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Created {createdAtFormatter.format(new Date(item.created_at))}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-900">Style:</span>{" "}
                        {item.selected_style || "Not selected"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Platforms:</span>{" "}
                        {platforms}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/dashboard/videos?seriesId=${item.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Video className="size-4" />
                        View videos
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleSeriesAction(item.id, "trigger")}
                        disabled={isBusy || isPaused}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <Sparkles className="size-4" />
                        {isBusy ? "Working..." : "Generate now"}
                      </button>
                    </div>
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
