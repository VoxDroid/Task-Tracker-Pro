import type { CSSProperties, SVGProps } from 'react'

export function AppLogo({ className, style, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      style={style}
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-secondary)" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Outer Border / Ring - Adapted to Theme Text Color */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="var(--color-text)"
        strokeWidth="4"
        opacity="0.9"
      />

      {/* Main Background Circle - Uses Gradient */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="url(#logoGradient)"
        className="transition-colors duration-300"
      />

      {/* Decorative Waves - Subtle darker highlights */}
      <path
        d="M 6 50 Q 25 30 50 65 T 94 50 A 44 44 0 0 1 6 50 Z"
        fill="var(--color-accent)"
        opacity="0.3"
        className="mix-blend-overlay"
      />
      <path
        d="M 6 50 Q 25 80 50 45 T 94 50 A 44 44 0 0 0 6 50 Z"
        fill="var(--color-background)"
        opacity="0.2"
        className="mix-blend-overlay"
      />

      {/* Text TTP - High Contrast */}
      <text
        x="50"
        y="66"
        textAnchor="middle"
        fontSize="38"
        fontWeight="bold"
        fontFamily="sans-serif"
        fill="var(--color-primary-foreground)"
        filter="url(#shadow)"
        className="select-none pointer-events-none"
      >
        TTP
      </text>
    </svg>
  )
}
