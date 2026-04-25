export default function MetricCard({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>{label}</p>
      <p className="text-3xl font-semibold" style={{ color: 'var(--color-primary)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>{sub}</p>}
    </div>
  )
}