import { Link } from 'react-router-dom'
import { Shield, Home, ArrowLeft } from 'lucide-react'

const Error403 = () => {
  return (
    <div className="min-h-screen bg-ultra-dark flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <div className="mx-auto h-16 w-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-6xl font-bold text-red-400">403</h1>
          <h2 className="text-2xl font-bold text-text-primary">Acceso denegado</h2>
          <p className="text-text-secondary">
            No tienes permisos para acceder a esta página.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Home size={16} />
            <span>Ir al inicio</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Volver atrás</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Error403