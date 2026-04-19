export default function InputBar({ message, setMessage, handleSend }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend()
  }

  return (

    <div className="fixed bottom-0 left-0 w-full flex justify-center pb-8 pt-4 px-4  z-50 ">
      <div
        className="flex items-center gap-3 bg-white rounded-full px-5 py-3 w-full max-w-2xl"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <input
          className="flex-1 text-sm outline-none bg-transparent"
          placeholder="Type your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          className="text-gray-400 hover:text-gray-700 cursor-pointer"
        >
          &#9654;
        </button>
      </div>
    </div>
  )
}