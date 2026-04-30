"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useClerk } from "@clerk/nextjs"

type Platform = "youtube" | "instagram" | "tiktok"

type SocialConnection = {
  platform: string
  username: string | null
  status: string | null
  updated_at: string
  last_synced_at: string | null
}

const SOCIALS: Array<{ id: Platform; title: string; description: string }> = [
  {
    id: "youtube",
    title: "YouTube Channel",
    description: "Required to upload and manage YouTube videos in future publishing.",
  },
  {
    id: "instagram",
    title: "Instagram Account",
    description: "Required to publish videos and fetch profile metadata.",
  },
  {
    id: "tiktok",
    title: "TikTok Account",
    description: "Required to publish TikTok videos from scheduled workflows.",
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signOut } = useClerk()

  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = searchParams.get("socialStatus")
  const message = searchParams.get("socialMessage")

  const map = useMemo(() => {
    const m = new Map<string, SocialConnection>()
    for (const item of connections) m.set(item.platform, item)
    return m
  }, [connections])

  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/social/connections")
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Failed to load connections")
        }
        const body = (await res.json()) as { connections?: SocialConnection[] }
        setConnections(Array.isArray(body.connections) ? body.connections : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }
    void run()
  }, [])

  function onConnect(platform: Platform) {
    setActivePlatform(platform)
    window.location.href = `/api/social/connect/${platform}`
  }

  async function onDeleteAccount() {
    const confirmText = window.prompt(
      'Type "DELETE" to remove your account and all related data permanently.',
    )
    if (confirmText !== "DELETE") return

    setIsDeleting(true)
    setError(null)
    try {
      const res = await fetch("/api/account", { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to delete account")
      }
      await signOut({ redirectUrl: "/" })
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-2 text-slate-600">
          Connect social accounts and manage account-level actions.
        </p>

        {status === "success" && message && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {status === "error" && message && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Social Accounts</h2>
        <p className="mt-1 text-sm text-slate-500">
          OAuth tokens are stored to support future automated publishing.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SOCIALS.map((social) => {
            const existing = map.get(social.id)
            const isConnected = Boolean(existing)
            const isBusy = activePlatform === social.id
            return (
              <article
                key={social.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-lg font-semibold text-slate-900">{social.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{social.description}</p>

                <p className="mt-4 text-sm font-medium text-slate-700">
                  {isConnected ? "Connected" : "Not connected"}
                </p>
                {existing?.username && (
                  <p className="mt-1 text-sm text-slate-600">@{existing.username}</p>
                )}

                <button
                  type="button"
                  onClick={() => onConnect(social.id)}
                  disabled={isBusy}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isBusy ? "Redirecting..." : isConnected ? "Reconnect" : "Connect"}
                </button>
              </article>
            )
          })}
        </div>

        {isLoading && <p className="mt-4 text-sm text-slate-500">Loading connections...</p>}
      </section>

      <section className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-red-800">Danger Zone</h2>
        <p className="mt-2 text-sm text-red-700">
          This permanently deletes your account and associated data.
        </p>

        <button
          type="button"
          onClick={() => void onDeleteAccount()}
          disabled={isDeleting}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {isDeleting ? "Deleting account..." : "Delete account"}
        </button>
      </section>
    </div>
  )
}
