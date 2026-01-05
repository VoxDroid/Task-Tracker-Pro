'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { AppLogo } from '@/components/app-logo'

export default function Loading() {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Schedule mount update asynchronously to avoid cascading renders
    const tMount = setTimeout(() => setMounted(true), 0)
    // Small delay to ensure smooth transition and prevent flashes
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => {
      clearTimeout(tMount)
      clearTimeout(timer)
    }
  }, [])

  // Prevent hydration mismatch and ensure background is always visible
  if (!mounted) {
    return (
      <div
        className="fixed inset-x-0 top-14 bottom-0 z-50"
        style={{ backgroundColor: 'var(--color-background)' } as CSSProperties}
      />
    )
  }

  return (
    <div
      className={`fixed inset-x-0 top-14 bottom-0 z-50 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={
        {
          backgroundColor: 'var(--color-background)',
          backdropFilter: 'blur(1px)'
        } as CSSProperties
      }
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Logo */}
        <div className="relative">
          <AppLogo
            className="h-16 w-16 transition-opacity duration-300"
            style={{ opacity: isVisible ? 1 : 0.7 } as CSSProperties}
          />
          {/* Loading ring */}
          <div className="absolute -inset-4 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin opacity-60"></div>
        </div>

        {/* Loading text */}
        <div
          className="text-center transition-opacity duration-300"
          style={{ opacity: isVisible ? 1 : 0.7 } as CSSProperties}
        >
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--color-text)' } as CSSProperties}
          >
            Loading Task Tracker Pro
          </h3>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce opacity-80"></div>
            <div
              className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce opacity-80"
              style={{ animationDelay: '0.15s' } as CSSProperties}
            ></div>
            <div
              className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce opacity-80"
              style={{ animationDelay: '0.3s' } as CSSProperties}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
