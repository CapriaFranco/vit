import { Link } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

const Error500 = () => {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-ultra-dark flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <div className="mx-auto h-16 w-16 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          <h1 className="text-6xl font-bold text-yellow-400">500</h1>
          <h2 className="text-2xl font-bold text-text-primary">Error del servidor</h2>
          <p className="text-text-secondary">
            Algo salió mal en nuestros servidores. Estamos trabajando para solucionarlo.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRefresh}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Reintentar</span>
          </button>
          <Link
            to="/"
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Home size={16} />
            <span>Ir al inicio</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Error500