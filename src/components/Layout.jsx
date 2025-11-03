import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Home, Users, GitBranch, Trophy } from 'lucide-react'
import Logo from './Logo'

const Layout = ({ children, title }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/a/login')
  }

  const navItems = [
    { path: '/a/dash', icon: Home, label: 'Dashboard' },
    { path: '/a/teams', icon: Users, label: 'Equipos' },
    { path: '/a/emparejamientos', icon: GitBranch, label: 'Emparejamientos' },
    { path: '/a/llaves', icon: Trophy, label: 'Llaves' },
  ]

  return (
    <div className="min-h-screen bg-ultra-dark">
      <nav className="border-b border-medium-gray bg-dark-gray">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <Logo size="sm" showText={false} className="sm:hidden" />
              <Logo size="md" className="hidden sm:block" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center space-x-2 lg:space-x-4">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-medium-gray'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 text-text-secondary hover:text-text-primary transition-colors text-xs lg:text-sm"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Salir</span>
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center justify-center space-x-1">
              {navItems.map(({ path, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`p-2.5 rounded-md transition-colors flex items-center justify-center ${
                    location.pathname === path
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-medium-gray'
                  }`}
                >
                  <Icon size={18} />
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="p-2.5 text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-8">
        {title && (
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export default Layout