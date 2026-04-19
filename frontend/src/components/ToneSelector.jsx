const TONES = [
  { label: '🏢 สุภาพทางการ', value: 'สุภาพทางการ' },
  { label: '😊 เป็นกันเอง', value: 'เป็นกันเอง' },
  { label: '⚡ กระชับ', value: 'กระชับ' },
]

export default function ToneSelector({ originalMessage, onSelect }) {
  return (
    <div className="flex gap-2 ml-0 flex-wrap">
      {TONES.map((tone) => (
        <button
          key={tone.value}
          onClick={() => onSelect(originalMessage, tone.value)}
          className="px-4 py-2 rounded-full text-sm cursor-pointer transition-all"
          style={{
            background: 'white',
            border: '1.5px solid #4a8c7f',
            color: '#4a8c7f',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4a8c7f'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.color = '#4a8c7f'
          }}
        >
          {tone.label}
        </button>
      ))}
    </div>
  )
}