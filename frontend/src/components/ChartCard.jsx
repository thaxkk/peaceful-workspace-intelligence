export default function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-4"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <p className="text-xs font-medium mb-4" style={{ color: 'var(--color-primary)' }}>
        {title}
      </p>
      {children}
    </div>
  )
}