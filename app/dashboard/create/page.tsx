"use client"

import React, { Suspense, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import CaptionStyle from "../../../components/ui/caption-style"
import WizardFooter from "../../../components/ui/wizard-footer"
import { Language, DeepgramVoices, FonadalabVoices } from "../../../lib/voiceData"
import { MusicTracks } from "../../../lib/musicData"
import type { SeriesPayload } from "../../../lib/series"

const AVAILABLE_NICHES = [
  { id: "scary", title: "Страшные истории", desc: "Короткие жуткие истории, которые привлекают зрителей." },
  { id: "motiv", title: "Мотивационные", desc: "Короткие мотивационные видеоролики." },
  { id: "tech", title: "Техно-советы", desc: "Быстрые советы и лайфхаки для технарей." },
  { id: "history", title: "Крошечная история", desc: "Короткие исторические факты." },
  { id: "funny", title: "Юмористические скетчи", desc: "Короткие комедийные скетчи и шутки." },
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
          <div key={i} className="w-1/6 text-center">Шаг {i + 1}</div>
        ))}
      </div>
    </div>
  )
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
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
        <h3 className="text-lg font-semibold">Выберите нишу</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setNicheType('available')} className={`px-3 py-1 rounded ${nicheType === 'available' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Готовая ниша</button>
          <button onClick={() => setNicheType('custom')} className={`px-3 py-1 rounded ${nicheType === 'custom' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Своя ниша</button>
        </div>
      </div>

      {nicheType === 'available' && (
        <div>
          <div className="h-64 overflow-auto border border-gray-100 rounded p-3 grid gap-3">
            {AVAILABLE_NICHES.map(n => (
              <button key={n.id} onClick={() => setSelectedNiche(n.id)} className={`text-left p-3 rounded-md border ${selectedNiche === n.id ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'} flex items-start`}>
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
          <p>Введите свою нишу ниже</p>
          <input value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} className="mt-3 w-full border rounded px-3 py-2" placeholder="например, Название ниши" />
        </div>
      )}
    </div>
  )
}

function CreateSeriesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const seriesId = searchParams.get("seriesId")
  const isEditMode = Boolean(seriesId)
  const [step, setStep] = useState(1)

  const [nicheType, setNicheType] = useState<'available' | 'custom'>('available')
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [customNiche, setCustomNiche] = useState<string>("")

  // состояние для остальных шагов
  const [language, setLanguage] = useState<string | null>(null)
  const [voice, setVoice] = useState<string | null>(null)
  const [languageModel, setLanguageModel] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [selectedBG, setSelectedBG] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState<string | null>(null)
  const [seriesName, setSeriesName] = useState<string>("")
  const [duration, setDuration] = useState<string>("30-50")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["vk"])
  const [publishTime, setPublishTime] = useState<string>("")
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isLoadingExistingSeries, setIsLoadingExistingSeries] = useState(false)

  useEffect(() => {
    if (!seriesId) return

    const loadSeries = async () => {
      setIsLoadingExistingSeries(true)
      setScheduleError(null)

      try {
        const res = await fetch(`/api/series/${seriesId}`)

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Не удалось загрузить серию")
        }

        const data = await res.json()
        const series = data.series as
          | ({
            niche_type?: string | null
            selected_niche?: string | null
            custom_niche?: string | null
            language?: string | null
            language_model?: string | null
            voice?: string | null
            selected_bg?: string[] | null
            selected_style?: string | null
            selected_caption_style?: string | null
            series_name?: string | null
            duration?: string | null
            selected_platforms?: string[] | null
            publish_time?: string | null
            step_payload?: Partial<SeriesPayload> | null
          })
          | null

        if (!series) {
          throw new Error("Серия не найдена")
        }

        const payload = series.step_payload ?? {}

        setNicheType(
          payload.nicheType === "custom" || series.niche_type === "custom"
            ? "custom"
            : "available",
        )
        setSelectedNiche(payload.selectedNiche ?? series.selected_niche ?? null)
        setCustomNiche(payload.customNiche ?? series.custom_niche ?? "")
        setLanguage(payload.language ?? series.language ?? null)
        setLanguageModel(payload.languageModel ?? series.language_model ?? null)
        setVoice(payload.voice ?? series.voice ?? null)
        setSelectedBG(payload.selectedBG ?? series.selected_bg ?? [])
        setSelectedStyle(payload.selectedStyle ?? series.selected_style ?? null)
        setSelectedCaptionStyle(
          payload.selectedCaptionStyle ?? series.selected_caption_style ?? null,
        )
        setSeriesName(payload.seriesName ?? series.series_name ?? "")
        setDuration(payload.duration ?? series.duration ?? "30-50")
        setSelectedPlatforms(["vk"])
        setPublishTime(
          payload.publishTime
            ? toDatetimeLocalValue(payload.publishTime)
            : toDatetimeLocalValue(series.publish_time ?? null),
        )
      } catch (error) {
        setScheduleError(
          error instanceof Error ? error.message : "Не удалось загрузить серию",
        )
      } finally {
        setIsLoadingExistingSeries(false)
      }
    }

    void loadSeries()
  }, [seriesId])

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
      // игнорируем
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

      const res = await fetch(seriesId ? `/api/series/${seriesId}` : "/api/series", {
        method: seriesId ? "PATCH" : "POST",
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
        throw new Error(data.error || "Не удалось запланировать серию")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : "Не удалось запланировать серию",
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
    isLoadingExistingSeries ||
    isScheduling ||
    seriesName.trim() === "" ||
    publishTime.trim() === ""

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Stepper step={step} />

        <div className="mb-4">
          <h1 className="text-2xl font-bold">{isEditMode ? "Редактировать серию" : "Создать серию"}</h1>
          <p className="text-sm text-slate-500">
            {isLoadingExistingSeries
              ? "Загрузка существующей серии..."
              : `Шаг ${step} из ${total} — выберите нишу для начала`}
          </p>
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
                <h3 className="font-semibold mb-3">Выберите язык</h3>
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
                <h3 className="font-semibold mb-3">Голоса ({languageModel || 'выберите язык'})</h3>
                <div className="h-64 overflow-auto grid gap-3">
                  {(!languageModel ? [] : (languageModel === 'deepgram' ? DeepgramVoices : FonadalabVoices)).map((v) => (
                    <div key={v.modelName} className={`p-3 rounded border flex items-center justify-between ${voice === v.modelName ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'}`}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-sm font-medium">{v.modelName.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-medium">{v.modelName}</div>
                          <div className="text-xs text-slate-500">Модель: {v.model} • Пол: {v.gender}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button onClick={() => togglePreview(`/voice/${v.preview}`)} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">Прослушать</button>

                        <button onClick={() => setVoice(v.modelName)} className={`px-3 py-1 rounded text-sm ${voice === v.modelName ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {voice === v.modelName ? 'Выбрано' : 'Выбрать'}
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
            <h3 className="font-semibold mb-3">Фоновая музыка</h3>
            <p className="text-sm text-slate-500 mb-4">Выберите один или несколько фоновых треков. Используйте предпросмотр для прослушивания.</p>

            <div className="h-64 overflow-auto grid gap-3">
              {MusicTracks.map((t) => (
                <div key={t.id} className={`p-3 rounded border flex items-center justify-between ${selectedBG.includes(t.id) ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'}`}>
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-slate-500">{t.url}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => togglePreview(t.url)} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">Прослушать</button>

                    <button onClick={() => {
                      setSelectedBG(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])
                    }} className={`px-3 py-1 rounded text-sm ${selectedBG.includes(t.id) ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {selectedBG.includes(t.id) ? 'Выбрано' : 'Выбрать'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step > 3 && step !== 5 && step !== 6 && (
          <div className="bg-white border rounded p-6 text-slate-600">Заглушка для шага {step}</div>
        )}

        {step === 6 && (
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <h3 className="font-semibold mb-3">Детали серии и расписание</h3>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название серии</label>
                <input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Введите название серии" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Длительность видео</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-56 border rounded px-3 py-2">
                  <option value="30-50">30-50 сек</option>
                  <option value="60-70">60-70 сек</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Публикация</label>
                <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-700">
                  Клипы ВК
                </div>
                <p className="text-xs text-slate-500 mt-2">Подключите ВК в настройках, чтобы публиковать клипы.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Время публикации</label>
                <input type="datetime-local" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} className="w-64 border rounded px-3 py-2" />
                <p className="text-xs text-slate-500 mt-2">Видео будет сгенерировано за 3-6 часов до публикации</p>
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
                  {isScheduling
                    ? isEditMode
                      ? "Сохранение..."
                      : "Планирование..."
                    : isEditMode
                      ? "Сохранить изменения"
                      : "Запланировать"}
                </button>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="bg-white rounded-md border border-gray-200 p-4">
            <h3 className="font-semibold mb-3">Стиль видео</h3>
            <p className="text-sm text-slate-500 mb-4">Выберите один визуальный стиль для генерируемого видео (9:16 портрет).</p>

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
            <h3 className="font-semibold mb-3">Стиль субтитров</h3>
            <p className="text-sm text-slate-500 mb-4">Выберите один анимированный стиль субтитров. Этот компонент будет использоваться при рендеринге в Remotion.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'fade-up', label: 'Появление' },
                { id: 'typewriter', label: 'Печатная машинка' },
                { id: 'slide-left', label: 'Сдвиг влево' },
                { id: 'pulse', label: 'Пульсация' },
                { id: 'bounce', label: 'Подпрыгивание' },
                { id: 'glow', label: 'Свечение' },
              ].map(s => (
                <div key={s.id}>
                  <CaptionStyle id={s.id} label={s.label} sample="Пример текста субтитров" selected={selectedCaptionStyle === s.id} onSelect={(id) => setSelectedCaptionStyle(id)} />
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

export default function CreateSeriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-6" />}>
      <CreateSeriesPageContent />
    </Suspense>
  )
}