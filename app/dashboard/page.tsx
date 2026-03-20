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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName,
          }),
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
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <p>Загрузка...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <p>Чтобы открыть панель управления, войдите в аккаунт.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-4">Панель управления</h1>
        <p className="text-slate-400 mb-2">
          Привет, {user.fullName || user.primaryEmailAddress?.emailAddress}!
        </p>
        {error && (
          <p className="text-sm text-red-400">
            Не удалось сохранить профиль в базе: {error}
          </p>
        )}
        {!error && synced && (
          <p className="text-sm text-emerald-400">
            Профиль пользователя сохранён в базе данных.
          </p>
        )}
      </div>
    </main>
  )
}

