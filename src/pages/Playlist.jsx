import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

const DEFAULT_PLAYLIST = {
  embedUrl: 'https://open.spotify.com/embed/playlist/3SWnYxh0WpSF4o2cqlN3tS',
  platform: 'spotify',
}

const convertToEmbedUrl = (url) => {
  if (url.includes('spotify.com')) {
    return url.replace('open.spotify.com', 'open.spotify.com/embed')
  }
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v')
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtu.be')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  return null
}

const detectPlatform = (url) => {
  if (url.includes('spotify.com')) return 'spotify'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return null
}

export default function Playlist() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  // โหลดจาก localStorage ถ้าไม่มีใช้ default
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem('playlists')
      return saved ? JSON.parse(saved) : [DEFAULT_PLAYLIST]
    } catch {
      return [DEFAULT_PLAYLIST]
    }
  })

  // save ลง localStorage ทุกครั้งที่ playlists เปลี่ยน
  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists))
  }, [playlists])

  const handleAdd = () => {
    if (!input.trim()) return
    const embedUrl = convertToEmbedUrl(input.trim())
    const platform = detectPlatform(input.trim())
    if (!embedUrl || !platform) {
      setError('Invalid link. Only Spotify and YouTube links are supported.')
      return
    }
    setPlaylists((prev) => [...prev, { embedUrl, platform }])
    setInput('')
    setError('')
  }

  const handleRemove = (index) => {
    setPlaylists((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="min-h-screen flex flex-col w-full" style={{ background: 'var(--color-bg2)' }}>
      <Navbar />

      <div className="flex-1 px-4 py-6 pb-28">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
              Add music or playlist
            </p>
            <div
              className="flex items-center gap-3 bg-white rounded-full px-5 py-3"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <input
                className="flex-1 text-sm outline-none bg-transparent"
                placeholder="Paste Spotify or YouTube link here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleAdd}
                className="text-sm font-medium px-4 py-1.5 rounded-full cursor-pointer border-none"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-light)' }}
              >
                Add
              </button>
            </div>
            {error && <p className="text-xs px-2 text-red-600">{error}</p>}
            <p className="text-xs px-2" style={{ color: 'var(--color-primary)' }}>
              * Spotify requires browser login to play full songs
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {playlists.map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ background: 'var(--color-accent)', color: 'var(--color-primary)' }}
                  >
                    {item.platform === 'spotify' ? '🎵 Spotify' : '▶ YouTube'}
                  </span>
                  <button
                    onClick={() => handleRemove(i)}
                    className="text-xs cursor-pointer"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Remove
                  </button>
                </div>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                >
                  <iframe
                    src={item.embedUrl}
                    width="100%"
                    height={item.platform === 'spotify' ? '152' : '315'}
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}