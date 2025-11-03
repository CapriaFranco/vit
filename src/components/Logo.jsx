import { Trophy } from 'lucide-react'

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 24, text: 'text-xl' },
    lg: { icon: 32, text: 'text-2xl' },
    xl: { icon: 40, text: 'text-3xl' }
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div className="relative bg-gradient-to-br from-accent to-accent-hover p-2 rounded-lg shadow-lg">
          <Trophy size={currentSize.icon} className="text-white" />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-text-primary ${currentSize.text} leading-none`}>
            Torneo
          </span>
          <span className="text-xs text-accent font-medium leading-none">
            LLAVES
          </span>
        </div>
      )}
    </div>
  )
}

export default Logo