"use client"

import { useEffect, useState } from "react"

export default function Template({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Small delay to ensure smooth fade in
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => {
      // Fade out when component unmounts (navigation away)
      setIsVisible(false)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div
      className={`transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  )
}