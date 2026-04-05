import { useState } from 'react'
import Navbar from '../components/Navbar'
import InputBar from '../components/InputBar'
import BotBubble from '../components/BotBubble'
import AiAvatar from '../components/AiAvatar'
import ToneSelector from '../components/ToneSelector'
import { checkFormality, rewriteMessage } from '../services/api'
import logo from '../assets/image.png'

export default function Analyze() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const hasMessages = messages.length > 0

  const handleSend = async () => {
    if (!message.trim()) return
    const originalText = message
    setMessages((prev) => [...prev, { role: 'user', text: originalText }])
    setMessage('')
    setLoading(true)

    try {
      const result = await checkFormality(originalText)
      if (result.isFormal) {
        setMessages((prev) => [...prev, {
          role: 'bot', type: 'formal',
          text: 'สุภาพมากครับ ไม่ต้องแก้ไขอะไร 😊',
        }])
      } else {
        setMessages((prev) => [...prev, {
          role: 'bot', type: 'select-tone',
          originalMessage: result.originalMessage,
        }])
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: 'bot', type: 'error',
        text: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      }])
    }
    setLoading(false)
  }

  const handleSelectTone = async (originalMessage, tone, msgIndex) => {
    setMessages((prev) =>
      prev.map((m, i) => i === msgIndex ? { ...m, type: 'rewriting' } : m)
    )
    try {
      const result = await rewriteMessage(originalMessage, tone)
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex ? {
            role: 'bot', type: 'rewritten',
            appliedTone: result.appliedTone,
            rewrittenMessage: result.rewrittenMessage,
          } : m
        )
      )
    } catch {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex
            ? { role: 'bot', type: 'error', text: 'เกิดข้อผิดพลาด' }
            : m
        )
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#eef5f0' }}>
      <Navbar />

      {/* ก่อนส่ง */}
      {!hasMessages && (
        <div className="flex-1 flex flex-col items-center justify-center gap-20 px-4 mb-20">
          <img src={logo} alt="logo" className="w-64" />
          <InputBar message={message} setMessage={setMessage} handleSend={handleSend} />
        </div>
      )}

      {/* หลังส่ง */}
      {hasMessages && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-2xl mx-auto flex flex-col gap-4 content-center">
              {messages.map((msg, i) => (
                <div key={i}>

                  {msg.role === 'user' && (
                    <div className="flex justify-end">
                      <div className="px-5 py-3 rounded-2xl text-sm text-white max-w-xs"
                        style={{ background: 'var(--color-primary)' }}>
                        {msg.text}
                      </div>
                    </div>
                  )}

                  {msg.role === 'bot' && msg.type === 'formal' && (
                    <BotBubble text={msg.text} />
                  )}

                  {msg.role === 'bot' && msg.type === 'error' && (
                    <BotBubble text={msg.text} isError />
                  )}

                  {msg.role === 'bot' && msg.type === 'select-tone' && (
                    <div className="flex flex-col gap-3">
                      <BotBubble text="ไม่สุภาพเลยนะคับ อยากให้แก้เป็นโทนไหนดีคับ?" />
                      <ToneSelector
                        originalMessage={msg.originalMessage}
                        onSelect={(original, tone) => handleSelectTone(original, tone, i)}
                      />
                    </div>
                  )}

                  {msg.role === 'bot' && msg.type === 'rewriting' && (
                    <div className="flex items-center gap-3">
                      <AiAvatar />
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  {msg.role === 'bot' && msg.type === 'rewritten' && (
                    <div className="flex flex-col gap-2">
                      <div className="ml-11 text-xs text-gray-400">โทน: {msg.appliedTone}</div>
                      <BotBubble text={msg.rewrittenMessage} />
                    </div>
                  )}

                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3">
                  <AiAvatar />
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 pb-6 pt-2" style={{ background: '#eef5f0' }}>
            <div className="max-w-2xl mx-auto">
              <InputBar message={message} setMessage={setMessage} handleSend={handleSend} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}