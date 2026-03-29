"use client"

import React from "react"

type Props = {
  id: string
  label: string
  sample?: string
  selected?: boolean
  onSelect?: (id: string) => void
}

export default function CaptionStyle({ id, label, sample = 'This is a sample caption', selected = false, onSelect }: Props) {
  return (
    <button onClick={() => onSelect?.(id)} className={`w-56 p-2 rounded border ${selected ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white'}`}>
      <div className="relative bg-slate-900 rounded h-40 overflow-hidden flex items-end justify-center p-3">
        <div className={`caption-preview caption-${id} text-white text-lg font-semibold`}>{sample}</div>
      </div>
      <div className="mt-2 text-center text-sm font-medium">{label}</div>

      <style>{`
        .caption-preview{position:relative}

        /* Fade Up */
        .caption-fade-up{opacity:0;transform:translateY(10px);animation:fadeUp 1.6s ease-in-out infinite alternate}
        @keyframes fadeUp{to{opacity:1;transform:translateY(0)}}

        /* Typewriter */
        .caption-typewriter{border-right:2px solid rgba(255,255,255,0.75);white-space:nowrap;overflow:hidden;display:inline-block;animation:typing 3s steps(20) infinite, blinkCaret .7s step-end infinite}
        @keyframes typing{from{width:0} to{width:100%}}
        @keyframes blinkCaret{50%{border-color:transparent}}

        /* Slide Left */
        .caption-slide-left{transform:translateX(100%);animation:slideLeft 1.2s ease-in-out infinite alternate}
        @keyframes slideLeft{to{transform:translateX(0)}}

        /* Pulse */
        .caption-pulse{animation:pulseCaption 1.5s ease-in-out infinite}
        @keyframes pulseCaption{0%{transform:scale(1);opacity:1}50%{transform:scale(1.03);opacity:.9}100%{transform:scale(1);opacity:1}}

        /* Bounce */
        .caption-bounce{animation:bounceCaption 1s ease-in-out infinite}
        @keyframes bounceCaption{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

        /* Glow */
        .caption-glow{text-shadow:0 0 4px rgba(255,255,255,0.6);animation:glow 1.8s ease-in-out infinite alternate}
        @keyframes glow{to{text-shadow:0 0 12px rgba(168,85,247,0.9)}}
      `}</style>
    </button>
  )
}
