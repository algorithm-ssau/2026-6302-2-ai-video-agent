"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"

const Icon = ({ name }: { name: string }) => {
  const common = { width: 20, height: 20, className: "inline-block mr-3" }
  switch (name) {
    case "series":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      )
    case "videos":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="15" height="10" rx="2" />
          <path d="M23 7l-6 5 6 5V7z" />
        </svg>
      )
    case "guides":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15V5a2 2 0 0 0-2-2H7" />
          <path d="M7 21h10" />
          <path d="M7 3v18" />
        </svg>
      )
    case "billing":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4" />
          <rect x="7" y="10" width="10" height="10" rx="2" />
        </svg>
      )
    case "settings":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 2.27 17.7l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.67 0 1.2-.47 1.51-1A1.65 1.65 0 0 0 3.9 5.6l-.06-.06A2 2 0 0 1 6.67 2.7l.06.06c.5.5 1.31.57 1.82.33.37-.18.78-.33 1.22-.33H11a2 2 0 0 1 4 0h.09c.44 0 .85.15 1.22.33.51.24 1.32.17 1.82-.33l.06-.06A2 2 0 0 1 21.73 6.3l-.06.06c-.24.5-.17 1.31.33 1.82.18.37.33.78.33 1.22V11a2 2 0 0 1 0 4h-.09c-.67 0-1.2.47-1.51 1z" />
        </svg>
      )
    default:
      return null
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 text-slate-900">
      <aside className="w-72 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
          <Image src="/logo.png" alt="logo" width={36} height={36} className="rounded-md" />
          <div>
            <div className="font-bold text-lg">VidMaxx</div>
            <div className="text-xs text-slate-500">Creator Studio</div>
          </div>
        </div>

        <div className="px-4 py-4">
          <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-md">+ Create new series</button>
        </div>

        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            <li>
              <Link href="#" className="flex items-center text-lg py-3 px-3 rounded-md hover:bg-gray-100">
                <Icon name="series" />
                Series
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center text-lg py-3 px-3 rounded-md hover:bg-gray-100">
                <Icon name="videos" />
                Videos
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center text-lg py-3 px-3 rounded-md hover:bg-gray-100">
                <Icon name="guides" />
                Guides
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center text-lg py-3 px-3 rounded-md hover:bg-gray-100">
                <Icon name="billing" />
                Billing
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center text-lg py-3 px-3 rounded-md hover:bg-gray-100">
                <Icon name="settings" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <Link href="#" className="flex items-center justify-between w-full bg-amber-500/10 hover:bg-amber-500/5 text-amber-700 font-medium py-2 px-3 rounded-md">
            <span>Upgrade</span>
            <span className="text-xs font-semibold bg-amber-500 text-white rounded px-2 py-0.5">Pro</span>
          </Link>

          <Link href="#" className="mt-3 flex items-center text-sm text-slate-600 hover:text-slate-900">
            <Image src="/logo.png" alt="user" width={28} height={28} className="rounded-full mr-3" />
            <span>Profile settings</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-h-screen">
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <div className="text-sm text-slate-500">Overview & recent activity</div>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
