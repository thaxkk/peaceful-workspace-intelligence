import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import bg from '../assets/bg.jpg'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
       <img src={logo} alt="logo" className="w-96" />

        <button
            onClick={() => navigate('/analyze')}
            className="px-12 py-2 rounded-full text-2xl font-semibold cursor-pointer border-none mt-2"
            style={{ background: '#FDE5AF', color: '#D3B464' }}
        >
            start
        </button>
    </div>
  )
}