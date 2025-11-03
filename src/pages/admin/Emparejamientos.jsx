import { useState, useEffect } from 'react'
import { GitBranch, Save, RotateCcw, Users, ArrowUp, ArrowDown } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'

const Emparejamientos = () => {
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState({ basico: [], superior: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Obtener equipos
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('course')
        .order('name')

      if (teamsError) throw teamsError

      // Separar equipos por ciclo
      const basicoCourses = ['1ro A', '1ro B', '1ro C', '2do A', '2do B', '2do C', '3ro A', '3ro B', '3ro C']
      const basicoTeams = teamsData.filter(team => basicoCourses.includes(team.course))
      const superiorTeams = teamsData.filter(team => !basicoCourses.includes(team.course))

      setTeams({ basico: basicoTeams, superior: superiorTeams })

      // Obtener emparejamientos existentes
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('cycle')
        .order('round')

      if (matchesError) throw matchesError

      const groupedMatches = matchesData.reduce((acc, match) => {
        if (!acc[match.cycle]) acc[match.cycle] = []
        acc[match.cycle].push(match)
        return acc
      }, { basico: [], superior: [] })

      setMatches(groupedMatches)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateBracket = (cycleTeams, cycle) => {
    if (cycleTeams.length < 2) return []

    const bracket = []
    
    // Solo generar la primera ronda con equipos reales
    for (let i = 0; i < cycleTeams.length; i += 2) {
      if (i + 1 < cycleTeams.length) {
        // Partido normal
        bracket.push({
          id: `${cycle}-r1-m${Math.floor(i/2) + 1}`,
          cycle,
          round: 1,
          team1_id: cycleTeams[i].id,
          team2_id: cycleTeams[i + 1].id,
          team1: cycleTeams[i],
          team2: cycleTeams[i + 1],
          winner_id: null,
          is_bye: false
        })
      } else {
        // Equipo que pasa automáticamente (bye)
        bracket.push({
          id: `${cycle}-r1-bye-${i}`,
          cycle,
          round: 1,
          team1_id: cycleTeams[i].id,
          team2_id: null,
          team1: cycleTeams[i],
          team2: null,
          winner_id: cycleTeams[i].id,
          is_bye: true
        })
      }
    }

    return bracket
  }

  const handleGenerateBrackets = () => {
    const basicoBracket = generateBracket(teams.basico, 'basico')
    const superiorBracket = generateBracket(teams.superior, 'superior')
    
    setMatches({
      basico: basicoBracket,
      superior: superiorBracket
    })
  }

  const handleSaveBrackets = async () => {
    setSaving(true)
    try {
      // Eliminar emparejamientos existentes
      await supabase.from('matches').delete().neq('id', 0)

      // Filtrar y preparar matches para insertar
      // Solo guardamos la primera ronda con equipos reales
      const allMatches = [...matches.basico, ...matches.superior]
        .filter(match => match.round === 1) // Solo primera ronda
        .map(match => ({
          cycle: match.cycle,
          round: match.round,
          team1_id: match.team1_id,
          team2_id: match.team2_id,
          winner_id: match.winner_id || null,
          is_bye: match.is_bye || false
        }))

      if (allMatches.length === 0) {
        alert('No hay emparejamientos para guardar. Genera las llaves primero.')
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('matches')
        .insert(allMatches)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      alert('Emparejamientos guardados exitosamente')
      await fetchData()
    } catch (error) {
      console.error('Error saving brackets:', error)
      alert(`Error al guardar emparejamientos: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTeamClick = (team, cycle, matchIndex, position) => {
    const teamKey = `${cycle}-${matchIndex}-${position}`
    
    if (!selectedTeam) {
      // Seleccionar primer equipo
      setSelectedTeam({ team, cycle, matchIndex, position, key: teamKey })
    } else {
      // Si es el mismo equipo, deseleccionar
      if (selectedTeam.key === teamKey) {
        setSelectedTeam(null)
        return
      }
      
      // Solo permitir intercambio dentro del mismo ciclo
      if (selectedTeam.cycle !== cycle) {
        setSelectedTeam(null)
        return
      }
      
      // Intercambiar equipos
      const newMatches = { ...matches }
      const cycleMatches = [...newMatches[cycle]]
      
      const firstMatch = cycleMatches[selectedTeam.matchIndex]
      const secondMatch = cycleMatches[matchIndex]
      
      // Guardar temporalmente los equipos
      const tempTeam = selectedTeam.position === 'team1' ? firstMatch.team1 : firstMatch.team2
      const tempTeamId = selectedTeam.position === 'team1' ? firstMatch.team1_id : firstMatch.team2_id
      
      // Intercambiar
      if (selectedTeam.position === 'team1') {
        firstMatch.team1 = position === 'team1' ? secondMatch.team1 : secondMatch.team2
        firstMatch.team1_id = position === 'team1' ? secondMatch.team1_id : secondMatch.team2_id
      } else {
        firstMatch.team2 = position === 'team1' ? secondMatch.team1 : secondMatch.team2
        firstMatch.team2_id = position === 'team1' ? secondMatch.team1_id : secondMatch.team2_id
      }
      
      if (position === 'team1') {
        secondMatch.team1 = tempTeam
        secondMatch.team1_id = tempTeamId
      } else {
        secondMatch.team2 = tempTeam
        secondMatch.team2_id = tempTeamId
      }
      
      newMatches[cycle] = cycleMatches
      setMatches(newMatches)
      setSelectedTeam(null)
    }
  }

  const moveMatch = (cycle, matchIndex, direction) => {
    const newMatches = { ...matches }
    const cycleMatches = [...newMatches[cycle]]
    
    const newIndex = direction === 'up' ? matchIndex - 1 : matchIndex + 1
    
    if (newIndex < 0 || newIndex >= cycleMatches.length) return
    
    // Intercambiar matches
    const temp = cycleMatches[matchIndex]
    cycleMatches[matchIndex] = cycleMatches[newIndex]
    cycleMatches[newIndex] = temp
    
    newMatches[cycle] = cycleMatches
    setMatches(newMatches)
  }

  const BracketPreview = ({ bracket, title, cycle }) => {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary flex items-center space-x-2">
            <GitBranch size={20} />
            <span>{title}</span>
            <span className="text-sm font-normal text-text-secondary">
              ({bracket.length} partidos)
            </span>
          </h3>
        </div>

        {bracket.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay emparejamientos generados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bracket.map((match, matchIndex) => (
              <div key={matchIndex} className="flex items-center space-x-2">
                {/* Flechas para mover el match */}
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => moveMatch(cycle, matchIndex, 'up')}
                    disabled={matchIndex === 0}
                    className="p-1 text-text-secondary hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover arriba"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveMatch(cycle, matchIndex, 'down')}
                    disabled={matchIndex === bracket.length - 1}
                    className="p-1 text-text-secondary hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover abajo"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                {/* Match container */}
                <div className="flex-1 bg-medium-gray rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-secondary font-semibold">
                      Match {matchIndex + 1}
                    </span>
                  </div>

                  <div className="flex items-center justify-center space-x-3">
                    {/* Equipo 1 */}
                    <div 
                      className={`flex-1 text-center p-3 rounded-lg cursor-pointer transition-all ${
                        selectedTeam?.key === `${cycle}-${matchIndex}-team1`
                          ? 'bg-accent bg-opacity-30 border-2 border-accent scale-105' 
                          : 'bg-ultra-dark hover:bg-dark-gray border-2 border-transparent'
                      }`}
                      onClick={() => match.team1 && handleTeamClick(match.team1, cycle, matchIndex, 'team1')}
                    >
                      <div className="font-medium text-text-primary">{match.team1?.name}</div>
                      <div className="text-xs text-text-secondary mt-1">
                        {match.team1?.course}
                      </div>
                    </div>

                    <div className="text-text-secondary font-bold text-sm">VS</div>

                    {/* Equipo 2 o BYE */}
                    {match.is_bye ? (
                      <div className="flex-1 text-center p-3 rounded-lg bg-ultra-dark border-2 border-dashed border-text-secondary opacity-50">
                        <div className="font-medium text-text-secondary">BYE</div>
                        <div className="text-xs text-text-secondary mt-1">
                          Pasa automáticamente
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`flex-1 text-center p-3 rounded-lg cursor-pointer transition-all ${
                          selectedTeam?.key === `${cycle}-${matchIndex}-team2`
                            ? 'bg-accent bg-opacity-30 border-2 border-accent scale-105' 
                            : 'bg-ultra-dark hover:bg-dark-gray border-2 border-transparent'
                        }`}
                        onClick={() => match.team2 && handleTeamClick(match.team2, cycle, matchIndex, 'team2')}
                      >
                        <div className="font-medium text-text-primary">
                          {match.team2?.name || 'TBD'}
                        </div>
                        {match.team2?.course && (
                          <div className="text-xs text-text-secondary mt-1">
                            {match.team2.course}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Layout title="Emparejamientos">
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Cargando datos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Configuración de Emparejamientos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-text-secondary">
            Genera y organiza los emparejamientos para ambos ciclos
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateBrackets}
              className="btn-secondary flex items-center space-x-2"
            >
              <RotateCcw size={16} />
              <span>Generar Llaves</span>
            </button>
            <button
              onClick={handleSaveBrackets}
              disabled={saving || (matches.basico.length === 0 && matches.superior.length === 0)}
              className="btn-primary flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>

        {/* Resumen de equipos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-text-primary mb-2">Ciclo Básico</h3>
            <p className="text-text-secondary">
              {teams.basico.length} equipos registrados
            </p>
            <div className="mt-2 text-sm text-text-secondary">
              {teams.basico.map(team => `${team.name} (${team.course})`).join(', ')}
            </div>
          </div>
          <div className="card">
            <h3 className="font-bold text-text-primary mb-2">Ciclo Superior</h3>
            <p className="text-text-secondary">
              {teams.superior.length} equipos registrados
            </p>
            <div className="mt-2 text-sm text-text-secondary">
              {teams.superior.map(team => `${team.name} (${team.course})`).join(', ')}
            </div>
          </div>
        </div>

        {/* Vista previa de llaves */}
        <div className="grid lg:grid-cols-2 gap-6">
          <BracketPreview 
            bracket={matches.basico} 
            title="Ciclo Básico" 
            cycle="basico"
          />
          <BracketPreview 
            bracket={matches.superior} 
            title="Ciclo Superior" 
            cycle="superior"
          />
        </div>
      </div>
    </Layout>
  )
}

export default Emparejamientos