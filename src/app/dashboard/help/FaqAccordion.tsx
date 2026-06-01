'use client'

import { useState } from 'react'

interface Question {
  q: string
  a: string
}

interface Props {
  questions: Question[]
}

export default function FaqAccordion({ questions }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {questions.map((question, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="w-full px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors flex items-start justify-between gap-3"
          >
            <span className="font-medium text-gray-900 text-sm">{question.q}</span>
            <span className={`text-[#0D7377] flex-shrink-0 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {openIdx === idx && (
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-700 space-y-2">
              {question.a.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
