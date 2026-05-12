"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

const ACTION_LABELS: Record<string, string> = {
  pause: "приостановить",
  resume: "возобновить",
  trigger: "выполнить генерацию",
  "execute-workflow": "выполнить рабочий процесс",
  delete: "удалить",
}

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

const createdAtFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

function getDisplayStatus(series: SeriesRecord) {
  if (series.step_payload?.isPaused) return "Приостановлено"
  if (series.status === "active") return "Активно"
  if (series.status === "processing") return "Обработка"
  if (series.status === "completed") return "Завершено"
  if (series.status === "failed") return "Ошибка"
  if (series.status === "cancelled") return "Отменено"
  return "Активно"
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Приостановлено":
      return "bg-amber-100 text-amber-800"
    case "Обработка":
      return "bg-blue-100 text-blue-700"
    case "Активно":
      return "bg-emerald-100 text-emerald-700"
    case "Завершено":
      return "bg-teal-100 text-teal-700"
    case "Ошибка":
      return "bg-red-100 text-red-700"
    case "Отменено":
      return "bg-slate-200 text-slate-700"
    default:
      return "bg-violet-100 text-violet-700"
  }
}

export default function DashboardPage() {
  const router = useRouter()
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
           throw new Error(data.error || "Не удалось синхронизировать пользователя")
         }

        setSynced(true)
       } catch (err) {
         setSyncError(err instanceof Error ? err.message : "Неизвестная ошибка")
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
           throw new Error(data.error || "Не удалось загрузить серии")
         }

        const data = await res.json()
        setSeries(Array.isArray(data.series) ? data.series : [])
       } catch (err) {
         setSeriesError(err instanceof Error ? err.message : "Неизвестная ошибка")
       } finally {
         setIsLoadingSeries(false)
       }
    }

    void loadSeries()
  }, [isLoaded, user])

  async function handleSeriesAction(
    id: number,
    action: "pause" | "resume" | "trigger" | "execute-workflow" | "delete",
  ) {
    if (actionSeriesId !== null) return

    const confirmed =
      action !== "delete" ||
      window.confirm("Удалить эту серию? Это действие нельзя отменить.")

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
         const actionLabel = ACTION_LABELS[action] || action
         throw new Error(data.error || `Не удалось ${actionLabel} серию`)
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

      if (action === "trigger" || action === "execute-workflow") {
        router.push(`/dashboard/videos?seriesId=${id}&generating=1`)
      }
      } catch (err) {
        setSeriesError(err instanceof Error ? err.message : "Неизвестная ошибка")
      } finally {
        setActionSeriesId(null)
      }
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Войдите, чтобы открыть панель управления.</p>
      </main>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Dashboard intro and account status messages. */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-violet-50 to-amber-50 p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Ваши серии видео агента
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              С возвращением, {user.fullName || user.primaryEmailAddress?.emailAddress}.
              Управляйте запланированными сериями, переходите к редактированию и запускайте новые генерации.
            </p>
          </div>

          <Link
            href="/dashboard/create"
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500"
          >
            Создать новую серию
          </Link>
        </div>

        {syncError && (
          <p className="mt-4 text-sm text-red-600">
            Ошибка синхронизации профиля: {syncError}
          </p>
        )}
        {!syncError && synced && (
          <p className="mt-4 text-sm text-emerald-600">
            Профиль синхронизирован, серии готовы к управлению.
          </p>
        )}
        {seriesError && (
          <p className="mt-2 text-sm text-red-600">{seriesError}</p>
        )}
      </section>

      {/* Series list with loading, empty, and populated states. */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Созданные серии</h2>
            <p className="text-sm text-slate-500">
              {series.length} всего серий
            </p>
          </div>
        </div>

        {isLoadingSeries ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Загрузка ваших серий...
          </div>
        ) : series.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-xl font-semibold text-slate-900">
              Серии еще не созданы
            </h3>
            <p className="mt-2 text-slate-500">
              Создайте свою первую серию и она появится здесь с действиями управления.
            </p>
            <Link
              href="/dashboard/create"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              Создать первую серию
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
                   : "Платформы не выбраны"

              return (
                /* Series card with preview, status, and actions. */
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
                         aria-label={`Редактировать ${item.series_name}`}
                       >
                        <Edit3 className="size-4" />
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                            aria-label={`Открыть опции для ${item.series_name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                             <Link href={`/dashboard/create?seriesId=${item.id}`}>
                               <Edit3 className="size-4" />
                               Редактировать
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
                            {isPaused ? "Возобновить серию" : "Приостановить серию"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => void handleSeriesAction(item.id, "delete")}
                            disabled={isBusy}
                          >
                            <Trash2 className="size-4" />
                            Удалить
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
                        <span className="font-medium text-slate-900">Стиль:</span>{" "}
                        {item.selected_style || "Не выбрано"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Платформы:</span>{" "}
                        {platforms}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/dashboard/videos?seriesId=${item.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Video className="size-4" />
                        Просмотреть видео
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleSeriesAction(item.id, "trigger")}
                        disabled={isBusy || isPaused}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <Sparkles className="size-4" />
                        {isBusy ? "Работаю..." : "Сгенерировать сейчас"}
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleSeriesAction(item.id, "execute-workflow")
                        }
                        disabled={isBusy || isPaused}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {isBusy ? "Работаю..." : "Выполнить рабочий процесс"}
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
