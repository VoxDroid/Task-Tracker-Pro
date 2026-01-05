'use client'

import type React from 'react'
import type { CSSProperties } from 'react'
import { Github, User, Code, ExternalLink } from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { AppLogo } from '@/components/app-logo'

export default function AboutPage() {
  return (
    <Sidebar>
      <div className="min-h-screen bg-[var(--color-background)]">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-[var(--color-surface)] rounded-2xl border-2 border-[var(--color-border)] p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <AppLogo className="h-16 w-16" />
              </div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                Task Tracker Pro
              </h1>
              <p
                className="text-lg opacity-70"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                A task tracking and activity management application.
              </p>
            </div>

            {/* App Version */}
            <div className="bg-[var(--color-primary)] bg-opacity-10 rounded-xl p-6 mb-6 border-2 border-[var(--color-primary)] border-opacity-20">
              <div className="flex items-center justify-center space-x-3">
                <Code size={24} style={{ color: 'var(--color-primary)' } as CSSProperties} />
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white">Version 1.0.0</h3>
                  <p className="text-sm opacity-50 text-white">Release Build</p>
                </div>
              </div>
            </div>

            {/* Developer Info & Help */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Developer */}
              <div className="bg-[var(--color-surface)] rounded-xl p-6 border-2 border-[var(--color-border)]">
                <div className="flex items-center space-x-3 mb-4">
                  <User size={24} style={{ color: 'var(--color-primary)' } as CSSProperties} />
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: 'var(--color-text)' } as CSSProperties}
                  >
                    Developer
                  </h3>
                </div>
                <p
                  className="text-lg font-medium"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  VoxDroid
                </p>
                <p
                  className="text-sm opacity-70 mt-2"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  Your daily developer.
                </p>
              </div>

              {/* Help & Support */}
              <div className="bg-[var(--color-surface)] rounded-xl p-6 border-2 border-[var(--color-border)]">
                <div className="flex items-center space-x-3 mb-4">
                  <Github size={24} style={{ color: 'var(--color-primary)' } as CSSProperties} />
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: 'var(--color-text)' } as CSSProperties}
                  >
                    Help & Support
                  </h3>
                </div>
                <a
                  href="https://github.com/VoxDroid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-lg font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-primary)' } as CSSProperties}
                >
                  <span>github.com/VoxDroid</span>
                  <ExternalLink size={16} />
                </a>
                <p
                  className="text-sm opacity-70 mt-2"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  Find documentation, report issues, and contribute
                </p>
              </div>
            </div>

            {/* Credits - Sena */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[var(--color-surface)] rounded-xl p-6 border-2 border-[var(--color-border)] col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <User size={24} style={{ color: 'var(--color-primary)' } as CSSProperties} />
                  <h3
                    className="text-2xl font-semibold"
                    style={{ color: 'var(--color-text)' } as CSSProperties}
                  >
                    Special Thanks: Sena
                  </h3>
                </div>
                <p
                  className="text-base opacity-80"
                  style={{ color: 'var(--color-text)' } as CSSProperties}
                >
                  Thank you, Sena, for your help testing, finding gaps, and suggesting features.
                  Your feedback made this app better!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t-2 border-[var(--color-border)]">
              <p
                className="text-sm opacity-70"
                style={{ color: 'var(--color-text)' } as CSSProperties}
              >
                © 2025 VoxDroid. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
