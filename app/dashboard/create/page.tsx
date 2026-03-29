"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import WizardFooter from "../../../components/ui/wizard-footer"
import { Language, DeepgramVoices, FonadalabVoices } from "../../../lib/voiceData"

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
  const [step, setStep] = useState(1)

  const [nicheType, setNicheType] = useState<'available'|'custom'>('available')
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [customNiche, setCustomNiche] = useState<string>("")

  // placeholder for other steps state
  const [language, setLanguage] = useState<string | null>(null)
  const [voice, setVoice] = useState<string | null>(null)
  const [languageModel, setLanguageModel] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const total = 6

  function handleBack() {
    setStep(s => Math.max(1, s - 1))
  }

  function handleContinue() {
    setStep(s => Math.min(total, s + 1))
  }

  const continueDisabled = (() => {
    if (step === 1) return nicheType === 'available' ? !selectedNiche : customNiche.trim() === ''
    if (step === 2) return !language || !voice
    return false
  })()

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
                  {(!languageModel ? [] : (languageModel === 'deepgram' ? DeepgramVoices : FonadalabVoices)).map((v, idx) => (
                    <div key={v.modelName} className={`p-3 rounded border flex items-center justify-between ${voice === v.modelName ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'}`}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-sm font-medium">{v.modelName.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-medium">{v.modelName}</div>
                          <div className="text-xs text-slate-500">Model: {v.model} • Gender: {v.gender}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button onClick={() => {
                          try {
                            if (!audioRef.current) audioRef.current = new Audio()
                            if (audioRef.current) {
                              audioRef.current.pause()
                              audioRef.current.src = `/voice/${v.preview}`
                              void audioRef.current.play()
                            }
                          } catch (e) {
                            // fail silently if file missing
                          }
                        }} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">Preview</button>

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

        {step > 2 && (
          <div className="bg-white border rounded p-6 text-slate-600">Placeholder for step {step}</div>
        )}

        <WizardFooter step={step} total={total} onBack={handleBack} onContinue={handleContinue} continueDisabled={continueDisabled} />
      </div>
    </div>
  )
}
