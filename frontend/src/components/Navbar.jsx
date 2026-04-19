import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { label: 'Analyze', path: '/analyze' },
    { label: 'Playlist', path: '/playlist' },
    { label: 'Dashboard', path: '/dashboard' },
  ]

  return (
    <nav className="flex justify-end items-center px-8 py-4 gap-2">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: isActive ? 'var(--color-secondary)' : 'transparent',
              color: isActive ? 'white' : '#000',
              border: '1.5px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.target.style.border = '1.5px solid var(--color-secondary)'
                e.target.style.color = '#4a8c7f'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.target.style.border = '1.5px solid transparent'
                e.target.style.color = '#000'
              }
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}