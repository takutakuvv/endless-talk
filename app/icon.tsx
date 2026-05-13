import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="white"/>
        <line x1="8" y1="9" x2="16" y2="9" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="13" x2="13" y2="13" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>,
    { ...size }
  )
}
