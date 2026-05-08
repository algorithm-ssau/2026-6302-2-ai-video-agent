"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useClerk } from "@clerk/nextjs"

type VkCommunityConnection = {
  id: number
  platform: "vk"
  communityId: number
  communityName: string | null
  isActive: boolean
  updatedAt: string
  createdAt: string
  tokenMasked: string | null
}

const CONNECTIONS_API_URL = "/api/social/connections"
const DELETE_ACCOUNT_API_URL = "/api/account"
const DELETE_CONFIRM_TEXT = "DELETE"

function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  return error instanceof Error ? error.message : fallback
}

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signOut } = useClerk()

  const [connections, setConnections] = useState<VkCommunityConnection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMutatingId, setIsMutatingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [communityId, setCommunityId] = useState("")
  const [communityName, setCommunityName] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingCommunityName, setEditingCommunityName] = useState("")
  const [editingAccessToken, setEditingAccessToken] = useState("")

  const status = searchParams.get("socialStatus")
  const message = searchParams.get("socialMessage")

  const map = useMemo(() => {
    const m = new Map<number, VkCommunityConnection>()
    for (const item of connections) m.set(item.id, item)
    return m
  }, [connections])

  useEffect(() => {
    async function loadConnections() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(CONNECTIONS_API_URL)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Failed to load connections")
        }
        const body = (await res.json()) as { connections?: VkCommunityConnection[] }
        setConnections(Array.isArray(body.connections) ? body.connections : [])
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    void loadConnections()
  }, [])

  async function reloadConnections() {
    const res = await fetch(CONNECTIONS_API_URL)
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body.error || "Failed to load connections")
    }
    setConnections(Array.isArray(body.connections) ? body.connections : [])
  }

  async function onAddCommunity() {
    if (isSaving) return
    setError(null)
    setIsSaving(true)
    try {
      const res = await fetch(CONNECTIONS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId,
          communityName,
          accessToken,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || "Failed to save community")
      }
      setCommunityId("")
      setCommunityName("")
      setAccessToken("")
      await reloadConnections()
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add community"))
    } finally {
      setIsSaving(false)
    }
  }

  function beginEdit(item: VkCommunityConnection) {
    setEditingId(item.id)
    setEditingCommunityName(item.communityName || "")
    setEditingAccessToken("")
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingCommunityName("")
    setEditingAccessToken("")
  }

  async function saveEdit(id: number) {
    if (isMutatingId !== null) return
    setError(null)
    setIsMutatingId(id)
    try {
      const payload: Record<string, unknown> = {
        communityName: editingCommunityName,
      }
      if (editingAccessToken.trim()) {
        payload.accessToken = editingAccessToken
      }

      const res = await fetch(`/api/social/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || "Failed to update community")
      }
      cancelEdit()
      await reloadConnections()
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update community"))
    } finally {
      setIsMutatingId(null)
    }
  }

  async function toggleActive(item: VkCommunityConnection) {
    if (isMutatingId !== null) return
    setError(null)
    setIsMutatingId(item.id)
    try {
      const res = await fetch(`/api/social/connections/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || "Failed to update status")
      }
      await reloadConnections()
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update status"))
    } finally {
      setIsMutatingId(null)
    }
  }

  async function removeCommunity(id: number) {
    if (isMutatingId !== null) return
    setError(null)
    setIsMutatingId(id)
    try {
      const res = await fetch(`/api/social/connections/${id}`, {
        method: "DELETE",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || "Failed to delete community")
      }
      if (editingId === id) {
        cancelEdit()
      }
      await reloadConnections()
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete community"))
    } finally {
      setIsMutatingId(null)
    }
  }

  async function onDeleteAccount() {
    const confirmText = window.prompt(
      'Type "DELETE" to remove your account and all related data permanently.',
    )
    if (confirmText !== DELETE_CONFIRM_TEXT) return

    setIsDeleting(true)
    setError(null)
    try {
      const res = await fetch(DELETE_ACCOUNT_API_URL, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to delete account")
      }
      await signOut({ redirectUrl: "/" })
      router.push("/")
    } catch (err) {
      setError(getErrorMessage(err))
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
        <h2 className="text-2xl font-semibold text-slate-900">VK Communities</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add one or more VK communities. Generated videos will be published to all active communities.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Add community</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={communityId}
              onChange={(event) => setCommunityId(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Community ID (e.g. 123456)"
            />
            <input
              value={communityName}
              onChange={(event) => setCommunityName(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Community name (optional)"
            />
            <input
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Community access token"
            />
          </div>
          <button
            type="button"
            onClick={() => void onAddCommunity()}
            disabled={isSaving}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? "Saving..." : "Add community"}
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {connections.map((item) => {
            const isEditing = editingId === item.id
            const isBusy = isMutatingId === item.id
            const current = map.get(item.id) || item
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {current.communityName || `Community #${current.communityId}`}
                    </h3>
                    <p className="text-sm text-slate-600">ID: {current.communityId}</p>
                    <p className="text-sm text-slate-600">
                      Token: {current.tokenMasked || "hidden"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      current.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {current.isActive ? "Active" : "Disabled"}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      value={editingCommunityName}
                      onChange={(event) => setEditingCommunityName(event.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Community name"
                    />
                    <input
                      value={editingAccessToken}
                      onChange={(event) => setEditingAccessToken(event.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="New token (optional)"
                    />
                    <div className="flex gap-2 md:col-span-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(item.id)}
                        disabled={isBusy}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleActive(item)}
                      disabled={isBusy}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                      {item.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => beginEdit(item)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCommunity(item.id)}
                      disabled={isBusy}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl space-y-8" />}>
      <SettingsPageContent />
    </Suspense>
  )
}
