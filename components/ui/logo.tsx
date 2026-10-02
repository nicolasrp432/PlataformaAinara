/** Mitra: a human centre, two rising arches forming an M, and three roots. */
export function MitraLogo({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="6.5" r="2.5" fill={color} />
      <path d="M6 23V15c0-3.8 4.1-5.3 6.2-2.1L16 19l3.8-6.1C21.9 9.7 26 11.2 26 15v8" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 19v8m0-4-4 4m4-4 4 4" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
