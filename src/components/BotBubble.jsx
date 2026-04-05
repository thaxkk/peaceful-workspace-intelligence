import AiAvatar from './AiAvatar'

export default function BotBubble({ text, isError }) {
  return (
    <div className="flex items-start gap-3">
      <AiAvatar />
      <div
        className="px-5 py-3 rounded-2xl text-sm max-w-xs shadow-sm"
        style={{
          background: isError ? '#fee2e2' : 'white',
          color: isError ? '#991b1b' : 'inherit',
        }}
      >
        {text}
      </div>
    </div>
  )
}