'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

function DelayedLoading() {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(true), 0)
    return () => clearTimeout(timer)
  }, [])

  if (!showLoading) return null

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Loading circle */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* Loading text with dots */}
        <div className="flex items-center space-x-2">
          <span
            className="text-lg font-medium"
            style={{ color: 'var(--color-text)' } as CSSProperties}
          >
            Loading
          </span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"
              style={{ animationDelay: '0.1s' } as CSSProperties}
            ></div>
            <div
              className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' } as CSSProperties}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return <DelayedLoading />
}
