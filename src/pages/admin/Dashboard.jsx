import { useState, useEffect } from 'react'
import { Users, GitBranch, Trophy, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTeams: 0,
    basicoTeams: 0,
    superiorTeams: 0,
    totalMatches: 0,
    completedMatches: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Contar equipos
      const { count: totalTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })

      const { count: basicoTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .in('course', ['1ro', '2do', '3ro A', '3ro B', '3ro C'])

      const { count: superiorTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .in('course', ['4to', '5to', '6to', '7mo 1ra', '7mo 2da'])

      // Contar partidos
      const { count: totalMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })

      const { count: completedMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .not('winner_id', 'is', null)

      setStats({
        totalTeams: totalTeams || 0,
        basicoTeams: basicoTeams || 0,
        superiorTeams: superiorTeams || 0,
        totalMatches: totalMatches || 0,
        completedMatches: completedMatches || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'accent' }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color} bg-opacity-20`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subtitle && (
            <p className="text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )

  const QuickAction = ({ to, icon: Icon, title, description }) => (
    <Link to={to} className="card hover:bg-medium-gray transition-colors group">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-accent bg-opacity-20 group-hover:bg-opacity-30 transition-colors">
          <Icon className="h-6 w-6 text-accent" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-text-primary">{title}</h3>
          <p className="text-text-secondary">{description}</p>
        </div>
      </div>
    </Link>
  )

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Total Equipos"
            value={stats.totalTeams}
            subtitle={`${stats.basicoTeams} básico, ${stats.superiorTeams} superior`}
          />
          <StatCard
            icon={GitBranch}
            title="Partidos Totales"
            value={stats.totalMatches}
          />
          <StatCard
            icon={Trophy}
            title="Partidos Completados"
            value={stats.completedMatches}
            subtitle={`${stats.totalMatches - stats.completedMatches} pendientes`}
          />
          <StatCard
            icon={Settings}
            title="Progreso"
            value={stats.totalMatches > 0 ? `${Math.round((stats.completedMatches / stats.totalMatches) * 100)}%` : '0%'}
            subtitle="del torneo"
          />
        </div>

        {/* Acciones rápidas */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAction
              to="/a/teams"
              icon={Users}
              title="Gestionar Equipos"
              description="Agregar, editar o eliminar equipos"
            />
            <QuickAction
              to="/a/emparejamientos"
              icon={GitBranch}
              title="Configurar Emparejamientos"
              description="Organizar los enfrentamientos por ronda"
            />
            <QuickAction
              to="/a/llaves"
              icon={Trophy}
              title="Administrar Llaves"
              description="Actualizar resultados y avanzar rondas"
            />
          </div>
        </div>

        {/* Estado del torneo */}
        <div className="card">
          <h2 className="text-xl font-bold text-text-primary mb-4">Estado del Torneo</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Ciclo Básico</span>
              <span className="text-text-primary font-medium">
                {stats.basicoTeams} equipos registrados
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Ciclo Superior</span>
              <span className="text-text-primary font-medium">
                {stats.superiorTeams} equipos registrados
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Partidos Completados</span>
              <span className="text-text-primary font-medium">
                {stats.completedMatches} de {stats.totalMatches}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard