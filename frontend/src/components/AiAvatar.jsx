import Ai from '../assets/AI.jpg'

export default function AiAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0"
      style={{
        backgroundImage: `url(${Ai})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}