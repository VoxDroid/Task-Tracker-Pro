'use client'

import type { CSSProperties } from 'react'
import { useState, useEffect } from 'react'
import { X, Minus, Square, Copy, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { AppLogo } from '@/components/app-logo'

// Extend CSS properties to include WebKit-specific properties
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
    WebkitUserSelect?: string
  }
}

export function TitleBar() {
  const { theme } = useTheme()
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // Check if window is maximized on mount and when it changes
    const handleMaximized = () => setIsMaximized(true)
    const handleUnmaximized = () => setIsMaximized(false)
    const handleEnteredFullscreen = () => setIsFullscreen(true)
    const handleLeftFullscreen = () => setIsFullscreen(false)

    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onWindowMaximized(handleMaximized)
      window.electronAPI.onWindowUnmaximized(handleUnmaximized)
      window.electronAPI.onWindowEnteredFullscreen(handleEnteredFullscreen)
      window.electronAPI.onWindowLeftFullscreen(handleLeftFullscreen)
    }

    return () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        // Clean up listeners if needed
      }
    }
  }, [])

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.minimizeWindow()
    }
  }

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.maximizeWindow()
      setIsMaximized(!isMaximized)
    }
  }

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.closeWindow()
    }
  }

  const handleToggleFullscreen = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.toggleFullscreen()
    }
  }

  const isDark = theme === 'dark'

  return (
    <div
      className="flex items-center justify-between px-4 py-2 select-none z-50 relative font-poppins"
      style={{
        WebkitAppRegion: 'drag', // Make the title bar draggable
        WebkitUserSelect: 'none',
        height: '56px', // Fixed height for consistent positioning
        position: 'relative',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '2px solid var(--color-border)'
      } as CSSProperties}
    >
      <div className="flex items-center">
        <AppLogo
          className="h-8 w-8"
          style={{ WebkitAppRegion: 'drag' }}
        />
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMinimize}
          className="h-8 w-8 p-0"
          style={{
            WebkitAppRegion: 'no-drag',
            color: 'var(--color-text)',
            '--hover-bg': 'rgba(234, 179, 8, 0.2)', // yellow-500 with opacity
            '--hover-color': '#facc15' // yellow-400
          } as any}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
            e.currentTarget.style.color = 'var(--hover-color)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-text)'
          }}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMaximize}
          className="h-8 w-8 p-0"
          style={{
            WebkitAppRegion: 'no-drag',
            color: 'var(--color-text)',
            '--hover-bg': 'rgba(34, 197, 94, 0.2)', // green-500 with opacity
            '--hover-color': '#4ade80' // green-400
          } as any}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
            e.currentTarget.style.color = 'var(--hover-color)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-text)'
          }}
        >
          {isMaximized ? (
            <Copy className="h-3 w-3 rotate-180" />
          ) : (
            <Square className="h-3 w-3" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleFullscreen}
          className="h-8 w-8 p-0"
          style={{
            WebkitAppRegion: 'no-drag',
            color: 'var(--color-text)',
            '--hover-bg': 'rgba(168, 85, 247, 0.2)', // violet-500 with opacity
            '--hover-color': '#c084fc' // violet-400
          } as any}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
            e.currentTarget.style.color = 'var(--hover-color)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-text)'
          }}
        >
          <Maximize className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0"
          style={{
            WebkitAppRegion: 'no-drag',
            color: 'var(--color-text)',
            '--hover-bg': 'rgba(239, 68, 68, 0.2)', // red-500 with opacity
            '--hover-color': '#f87171' // red-400
          } as any}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
            e.currentTarget.style.color = 'var(--hover-color)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-text)'
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}