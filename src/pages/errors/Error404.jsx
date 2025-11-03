import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const Error404 = () => {
  return (
    <div className="min-h-screen bg-ultra-dark flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-accent">404</h1>
          <h2 className="text-2xl font-bold text-text-primary">Página no encontrada</h2>
          <p className="text-text-secondary">
            La página que buscas no existe o ha sido movida.
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

export default Error404