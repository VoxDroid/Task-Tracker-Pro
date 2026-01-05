'use client'

import { useEffect, useState } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    // Small delay to ensure smooth fade in
    const timer = setTimeout(() => setContentVisible(true), 50)
    return () => {
      // Fade out when component unmounts (navigation away)
      setContentVisible(false)
      clearTimeout(timer)
    }
  }, [])

  // Store the visibility state in a way that the sidebar can access it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.pageContentVisible = contentVisible
    }
  }, [contentVisible])

  return <>{children}</>
}
