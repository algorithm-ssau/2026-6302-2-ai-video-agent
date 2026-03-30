"use client"

import React, { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import CaptionStyle from "../../../components/ui/caption-style"
import WizardFooter from "../../../components/ui/wizard-footer"
import { Language, DeepgramVoices, FonadalabVoices } from "../../../lib/voiceData"
import { MusicTracks } from "../../../lib/musicData"

const AVAILABLE_NICHES = [
  { id: "scary", title: "Scary Stories", desc: "Short creepy tales that hook viewers." },
  { id: "motiv", title: "Motivational", desc: "Punchy motivational short clips." },
  { id: "tech", title: "Tech Tips", desc: "Quick tips and hacks for techies." },
  { id: "history", title: "Tiny History", desc: "Bite-sized historical facts." },
  { id: "funny", title: "Humor Skits", desc: "Short comedy sketches and gags." },
]

function NicheIcon({ id }: { id: string }) {
  const common = { width: 36, height: 36, className: "flex-shrink-0 mr-3" }
  switch (id) {
    case "scary":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8 6 5 6 3 9c2 3 1 6 4 9 3 3 6 3 9 0 3-3 2-6 4-9-2-3-5-3-8-7z" />
        </svg>
      )
    case "motiv":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M2 12h20" />
        </svg>
      )
    case "tech":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case "history":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7h18M12 3v18" />
        </svg>
      )
    case "funny":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        </svg>
      )
    default:
      return null
  }
}

function PlatformButton({ id, label, active, onToggle }: { id: string; label: string; active: boolean; onToggle: () => void }) {
  const common = 'flex items-center gap-2 px-3 py-2 rounded-md border';
  const activeClass = active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-100 hover:bg-gray-50'

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`${common} ${activeClass}`}
    >
      <span className="w-5 h-5 flex items-center justify-center text-lg">
        <PlatformIcon name={id} />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function PlatformIcon({ name }: { name: string }) {
  switch (name) {
    case 'tiktok':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3v10.5a4.5 4.5 0 11-4.5-4.5V9a6 6 0 006 6 6 6 0 000-12h-.5z" fill="currentColor" />
        </svg>
      )
    case 'youtube':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 15l5-3-5-3v6z" fill="currentColor" />
          <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      )
    case 'vk':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4h18v16H3z" fill="currentColor" opacity="0.05" />
          <path d="M8 9c2 0 3 2 5 2s3-2 5-2v1c-2 0-3 2-5 2s-3-2-5-2v-1z" fill="currentColor" />
        </svg>
      )
    case 'email':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6.5v11a1 1 0 001 1h16a1 1 0 001-1v-11" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M3.5 6.5l8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      )
    default:
      return null
  }
}

function Stepper({ step }: { step: number }) {
  const total = 6
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {Array.from({ length: total }).map((_, i) => {
          const idx = i + 1
          const active = idx <= step
          return (
            <div key={i} className="flex-1">
              <div className={`h-2 rounded ${active ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="w-1/6 text-center">Step {i + 1}</div>
        ))}
      </div>
    </div>
  )
}

function NicheSelection({
  nicheType,
  setNicheType,
  selectedNiche,
  setSelectedNiche,
  customNiche,
  setCustomNiche,
}: {
  nicheType: 'available' | 'custom'
  setNicheType: (v: 'available' | 'custom') => void
  selectedNiche: string | null
  setSelectedNiche: (id: string | null) => void
  customNiche: string
  setCustomNiche: (s: string) => void
}) {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Niche</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setNicheType('available')} className={`px-3 py-1 rounded ${nicheType==='available' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Available Niche</button>
          <button onClick={() => setNicheType('custom')} className={`px-3 py-1 rounded ${nicheType==='custom' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Custom Niche</button>
        </div>
      </div>

      {nicheType === 'available' && (
        <div>
          <div className="h-64 overflow-auto border border-gray-100 rounded p-3 grid gap-3">
            {AVAILABLE_NICHES.map(n => (
              <button key={n.id} onClick={() => setSelectedNiche(n.id)} className={`text-left p-3 rounded-md border ${selectedNiche===n.id ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'} flex items-start` }>
                <NicheIcon id={n.id} />
                <div className="flex-1">
                  <div className="font-medium text-base">{n.title}</div>
                  <div className="text-sm text-slate-500 mt-1">{n.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {nicheType === 'custom' && (
        <div className="border border-dashed border-gray-200 rounded p-6 text-slate-600">
          <p>Enter your custom niche below</p>
          <input value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} className="mt-3 w-full border rounded px-3 py-2" placeholder="e.g. Niche name" />
        </div>
      )}
    </div>
  )
}

export default function CreateSeriesPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [nicheType, setNicheType] = useState<'available'|'custom'>('available')
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [customNiche, setCustomNiche] = useState<string>("")

  // placeholder for other steps state
  const [language, setLanguage] = useState<string | null>(null)
  const [voice, setVoice] = useState<string | null>(null)
  const [languageModel, setLanguageModel] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [selectedBG, setSelectedBG] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState<string | null>(null)
  const [seriesName, setSeriesName] = useState<string>("")
  const [duration, setDuration] = useState<string>("30-50")
  const PLATFORMS = [
    { id: 'tiktok', label: 'TikTok' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'vk', label: 'VK' },
    { id: 'email', label: 'Email' },
  ]
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [publishTime, setPublishTime] = useState<string>("")
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)

  function togglePreview(src: string) {
    try {
      if (!audioRef.current) audioRef.current = new Audio()
      const a = audioRef.current
      const currentSrc = a.src || ''
      const same = currentSrc.includes(src) || src.includes(currentSrc)
      if (!a.paused && same) {
        a.pause()
        a.currentTime = 0
        return
      }
      a.pause()
      a.src = src
      void a.play()
    } catch {
      // ignore
    }
  }

  const total = 6

  function handleBack() {
    setStep(s => Math.max(1, s - 1))
  }

  function handleContinue() {
    setStep(s => Math.min(total, s + 1))
  }

  async function handleSchedule() {
    if (isScheduling) return

    setScheduleError(null)
    setIsScheduling(true)

    try {
      const selectedBGMeta = MusicTracks.filter((track) =>
        selectedBG.includes(track.id),
      )

      const res = await fetch("/api/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nicheType,
          selectedNiche,
          customNiche,
          language,
          languageModel,
          voice,
          selectedBG,
          selectedBGMeta,
          selectedStyle,
          selectedCaptionStyle,
          seriesName,
          duration,
          selectedPlatforms,
          publishTime,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to schedule series")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : "Failed to schedule series",
      )
    } finally {
      setIsScheduling(false)
    }
  }

  const continueDisabled = (() => {
    if (step === 1) return nicheType === 'available' ? !selectedNiche : customNiche.trim() === ''
    if (step === 2) return !language || !voice
    if (step === 4) return !selectedStyle
    if (step === 5) return !selectedCaptionStyle
    return false
  })()

  const scheduleDisabled =
    isScheduling ||
    seriesName.trim() === "" ||
    selectedPlatforms.length === 0 ||
    publishTime.trim() === ""

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Stepper step={step} />

        <div className="mb-4">
          <h1 className="text-2xl font-bold">Create Series</h1>
          <p className="text-sm text-slate-500">Step {step} of {total} — pick niche to start</p>
        </div>

        {step === 1 && (
          <NicheSelection
            nicheType={nicheType}
            setNicheType={setNicheType}
            selectedNiche={selectedNiche}
            setSelectedNiche={setSelectedNiche}
            customNiche={customNiche}
            setCustomNiche={setCustomNiche}
          />
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="bg-white rounded-md border border-gray-200 p-4">
                <h3 className="font-semibold mb-3">Choose Language</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Language.map((L) => (
                    <button key={L.modelLangCode} onClick={() => { setLanguage(L.language); setLanguageModel(L.modelName); setVoice(null) }} className={`flex items-center gap-3 p-3 rounded border ${language === L.language ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'}`}>
                      <div className="text-2xl">{L.countryFlag}</div>
                      <div className="text-left">
                        <div className="font-medium">{L.language}</div>
                        <div className="text-xs text-slate-500">{L.modelLangCode}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-md border border-gray-200 p-4">
                <h3 className="font-semibold mb-3">Voices ({languageModel || 'select language'})</h3>
                <div className="h-64 overflow-auto grid gap-3">
                  {(!languageModel ? [] : (languageModel === 'deepgram' ? DeepgramVoices : FonadalabVoices)).map((v) => (
                    <div key={v.modelName} className={`p-3 rounded border flex items-center justify-between ${voice === v.modelName ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'}`}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-sm font-medium">{v.modelName.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-medium">{v.modelName}</div>
                          <div className="text-xs text-slate-500">Model: {v.model} • Gender: {v.gender}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button onClick={() => togglePreview(`/voice/${v.preview}`)} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">Preview</button>

                        <button onClick={() => setVoice(v.modelName)} className={`px-3 py-1 rounded text-sm ${voice === v.modelName ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {voice === v.modelName ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <h3 className="font-semibold mb-3">Background Music</h3>
            <p className="text-sm text-slate-500 mb-4">Select one or more background tracks. Use preview to listen.</p>

            <div className="h-64 overflow-auto grid gap-3">
              {MusicTracks.map((t) => (
                <div key={t.id} className={`p-3 rounded border flex items-center justify-between ${selectedBG.includes(t.id) ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'}`}>
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-slate-500">{t.url}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => togglePreview(t.url)} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">Preview</button>

                    <button onClick={() => {
                      setSelectedBG(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])
                    }} className={`px-3 py-1 rounded text-sm ${selectedBG.includes(t.id) ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {selectedBG.includes(t.id) ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step > 3 && step !== 5 && step !==6 && (
          <div className="bg-white border rounded p-6 text-slate-600">Placeholder for step {step}</div>
        )}

        {step === 6 && (
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <h3 className="font-semibold mb-3">Series Details & Schedule</h3>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Series Name</label>
                <input value={seriesName} onChange={(e)=>setSeriesName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Enter series name" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Video duration</label>
                <select value={duration} onChange={(e)=>setDuration(e.target.value)} className="w-56 border rounded px-3 py-2">
                  <option value="30-50">30-50 sec</option>
                  <option value="60-70">60-70 sec</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Platforms to publish</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => (
                    <PlatformButton
                      key={p.id}
                      id={p.id}
                      label={p.label}
                      active={selectedPlatforms.includes(p.id)}
                      onToggle={() => setSelectedPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Note: platforms listed in the project docs: see [README.md](README.md#L36) and UI at [app/page.tsx](app/page.tsx#L114).</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Publish time</label>
                <input type="datetime-local" value={publishTime} onChange={(e)=>setPublishTime(e.target.value)} className="w-64 border rounded px-3 py-2" />
                <p className="text-xs text-slate-500 mt-2">Video will generate 3-6 hours before video publish</p>
              </div>

              {scheduleError && (
                <p className="text-sm text-red-600">{scheduleError}</p>
              )}

              <div className="pt-2">
                <button
                  onClick={() => void handleSchedule()}
                  disabled={scheduleDisabled}
                  className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScheduling ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <h3 className="font-semibold mb-3">Video Style</h3>
            <p className="text-sm text-slate-500 mb-4">Choose one visual style for the generated video (9:16 portrait).</p>

            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4">
                {[
                  '3d-render.png',
                  'anime.png',
                  'cinematic.png',
                  'cyberpunk.png',
                  'gta.png',
                  'realistic.png',
                ].map((img) => {
                  const id = img.replace(/\.[^.]+$/, '')
                  const selected = selectedStyle === id
                  return (
                    <button key={img} onClick={() => setSelectedStyle(selected ? null : id)} className={`flex-shrink-0 w-40 md:w-56 ${selected ? 'ring-2 ring-purple-600' : ''}`}>
                      <div className="relative w-full" style={{ paddingTop: '177.77%' }}>
                        <Image src={`/video-style/${img}`} alt={id} fill sizes="(max-width: 768px) 40vw, 224px" style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="mt-2 text-center text-sm font-medium">{id}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <h3 className="font-semibold mb-3">Caption Style</h3>
            <p className="text-sm text-slate-500 mb-4">Choose one animated caption style. This component is reusable and will be used in Remotion rendering.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'fade-up', label: 'Fade Up' },
                { id: 'typewriter', label: 'Typewriter' },
                { id: 'slide-left', label: 'Slide Left' },
                { id: 'pulse', label: 'Pulse' },
                { id: 'bounce', label: 'Bounce' },
                { id: 'glow', label: 'Glow' },
              ].map(s => (
                <div key={s.id}>
                  <CaptionStyle id={s.id} label={s.label} sample="Sample caption text" selected={selectedCaptionStyle===s.id} onSelect={(id)=> setSelectedCaptionStyle(id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        <WizardFooter step={step} total={total} onBack={handleBack} onContinue={handleContinue} continueDisabled={continueDisabled} />
      </div>
    </div>
  )
}
