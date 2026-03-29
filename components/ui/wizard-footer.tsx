"use client"

import React from "react"

type Props = {
  step: number
  total?: number
  onBack?: () => void
  onContinue: () => void
  continueDisabled?: boolean
}

export default function WizardFooter({ step, total = 6, onBack, onContinue, continueDisabled = false }: Props) {
  const disabled = Boolean(continueDisabled)

  return (
    <div className="mt-6 border-t pt-4 flex items-center justify-between">
      <div>
        {step > 1 ? (
          <button onClick={onBack} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">
            Back
          </button>
        ) : null}
      </div>

      <div className="text-sm text-slate-500">Step {step} of {total}</div>

      <div>
        <button onClick={onContinue} disabled={disabled ? true : undefined} className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50">
          Continue
        </button>
      </div>
    </div>
  )
}
