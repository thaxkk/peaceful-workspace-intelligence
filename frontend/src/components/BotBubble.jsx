import { useState } from 'react'
import AiAvatar from './AiAvatar'

export default function BotBubble({ text, isError }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
  if (!text) return

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // fallback สำหรับ HTTP / IP
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  } catch (err) {
    console.error('copy failed:', err)
  }
}

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-3">
        <AiAvatar />
        
        {/* ครอบ Bubble และปุ่ม Copy ด้วย flex items-end เพื่อให้อยู่ข้างกันและชิดล่าง */}
        <div className="flex items-end gap-0">
          <div
            className="px-5 py-3 rounded-2xl text-sm max-w-xs shadow-sm"
            style={{
              background: isError ? '#fee2e2' : 'white',
              color: isError ? '#991b1b' : 'inherit',
            }}
          >
            {text}
          </div>

          {/* copy button — แสดงเฉพาะตอนไม่ error */}
          {!isError && (
            <button
              onClick={handleCopy}
              // เอา ml-11 ออก แล้วเพิ่ม pb-1 นิดหน่อยให้ดูพอดีกับขอบบับเบิ้ล
              className="flex items-center gap-1 text-xs cursor-pointer px-2 py-1 rounded-lg transition-all pb-2"
              style={{
                color: copied ? 'var(--color-primary)' : '#aaa',
                background: copied ? 'transparent' : 'transparent',
                border: 'none',
              }}
            >
              {copied ? (
                // checkmark icon
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                // copy icon
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}