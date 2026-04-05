import AiAvatar from './AiAvatar'

export default function BotBubble({ text, isError }) {
  return (
    <div className="flex items-start gap-3">
      <div className='mt-6.5'>
        <AiAvatar />
      </div>
      
      {/* เพิ่ม div ครอบจัดเลย์เอาต์แบบบน-ล่าง (flex-col) */}
      <div className="flex flex-col gap-1">
        
        {/* ส่วนแสดงชื่อคนส่ง */}
        <span className="text-xs text-gray-500 ml-1">เไ ปอน</span>
        
        {/* กล่องข้อความเดิม */}
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
    </div>
  )
}