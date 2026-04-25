import { useRef, useEffect } from 'react'

export default function InputBar({ message, setMessage, handleSend }) {
  const textareaRef = useRef(null)

  const handleInput = (e) => {
    setMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  useEffect(() => {
    if (message === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [message])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend()
  }

  return (

    
      <div
        className="flex items-center gap-3 bg-white rounded-full px-5 py-3 w-full max-w-2xl"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 text-sm outline-none bg-transparent resize-none overflow-y-auto break-all pl-4 pr-1 max-h-30 min-h-5"
          rows="1"
          placeholder="Type your message"
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          style={{ overflow: 'auto' }}
        />
        <button
          onClick={handleSend}
          className="text-gray-400 hover:text-gray-700 cursor-pointer pb-1"
        >
          &#9654;
        </button>
      </div>

  )
}