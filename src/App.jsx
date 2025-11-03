import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Teams from './pages/admin/Teams'
import Emparejamientos from './pages/admin/Emparejamientos'
import Llaves from './pages/admin/Llaves'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Error404 from './pages/errors/Error404'
import Error403 from './pages/errors/Error403'
import Error500 from './pages/errors/Error500'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-ultra-dark">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/a/login" element={<Login />} />
          <Route path="/a/dash" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/a/teams" element={
            <ProtectedRoute>
              <Teams />
            </ProtectedRoute>
          } />
          <Route path="/a/emparejamientos" element={
            <ProtectedRoute>
              <Emparejamientos />
            </ProtectedRoute>
          } />
          <Route path="/a/llaves" element={
            <ProtectedRoute>
              <Llaves />
            </ProtectedRoute>
          } />
          <Route path="/error/403" element={<Error403 />} />
          <Route path="/error/500" element={<Error500 />} />
          <Route path="*" element={<Error404 />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App