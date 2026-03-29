"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [synced, setSynced] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    void run()
  }, [isLoaded, user, synced])

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
        <p>Чтобы открыть панель управления, войдите в аккаунт.</p>
      </main>
    )
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Панель управления</h1>
        <p className="text-slate-600 mb-2">
          Привет, {user.fullName || user.primaryEmailAddress?.emailAddress}!
        </p>
        {error && (
          <p className="text-sm text-red-500">
            Не удалось сохранить профиль в базе: {error}
          </p>
        )}
        {!error && synced && (
          <p className="text-sm text-emerald-600">
            Профиль пользователя сохранён в базе данных.
          </p>
        )}
      </div>
    </div>
  )
}

