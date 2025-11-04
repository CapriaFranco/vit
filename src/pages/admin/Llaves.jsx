import { useState, useEffect } from 'react'
import { Trophy, Edit2, Save, X, Settings } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import TournamentBracket from '../../components/TournamentBracket'

const Llaves = () => {
  const [matches, setMatches] = useState({ basico: [], superior: [] })
  const [loading, setLoading] = useState(true)
  const [selectedCycle, setSelectedCycle] = useState('basico')
  const [zoomLevel, setZoomLevel] = useState(0.9)
  const [editingMatch, setEditingMatch] = useState(null)
  const [scoreForm, setScoreForm] = useState({
    team1_sets: 0,
    team2_sets: 0,
    score_detail: '',
    sets: []
  })
  const [finalFormat, setFinalFormat] = useState({ basico: 3, superior: 5 })
  const [showFormatModal, setShowFormatModal] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [])

  const processAutomaticByes = async () => {
    // Esta función ya no se usa automáticamente al cargar
    // Los BYEs se procesan cuando se completa un match
    return
  }

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey(id, name, course),
          team2:teams!matches_team2_id_fkey(id, name, course)
        `)
        .order('cycle')
        .order('round')

      if (error) throw error

      const groupedMatches = data.reduce((acc, match) => {
        if (!acc[match.cycle]) acc[match.cycle] = []
        acc[match.cycle].push(match)
        return acc
      }, { basico: [], superior: [] })

      // Generar rondas siguientes dinámicamente
      const expandedMatches = {
        basico: generateAllRounds(groupedMatches.basico, 'basico'),
        superior: generateAllRounds(groupedMatches.superior, 'superior')
      }

      setMatches(expandedMatches)
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAllRounds = (matches, cycle) => {
    if (matches.length === 0) return []

    // Agrupar matches por ronda
    const matchesByRound = matches.reduce((acc, match) => {
      if (!acc[match.round]) acc[match.round] = []
      acc[match.round].push(match)
      return acc
    }, {})

    // Ordenar matches de la primera ronda por ID
    const firstRoundMatches = [...(matchesByRound[1] || [])]
      .sort((a, b) => a.id - b.id)
    
    if (firstRoundMatches.length === 0) return matches

    // Estructura para almacenar todos los partidos con su posición en el bracket
    const bracketStructure = []
    
    // Agregar primera ronda con índices de posición y manejar BYEs automáticamente
    firstRoundMatches.forEach((match, index) => {
      let processedMatch = {
        ...match,
        bracketPosition: index,
        round: 1
      }
      
      // Si el match no tiene team2 o es BYE, automáticamente el team1 gana
      if (!match.team2 || match.is_bye || !match.team2_id) {
        processedMatch = {
          ...processedMatch,
          is_bye: true,
          winner_id: match.team1_id,
          team1_sets: 1,
          team2_sets: 0
        }
      }
      
      bracketStructure.push(processedMatch)
    })

    // Calcular cuántas rondas necesitamos
    const totalTeams = firstRoundMatches.reduce((sum, match) => {
      if (match.is_bye) return sum + 1
      return sum + 2
    }, 0)
    
    const maxRounds = Math.ceil(Math.log2(totalTeams))
    
    // Generar rondas siguientes
    for (let round = 2; round <= maxRounds; round++) {
      const previousRoundMatches = bracketStructure.filter(m => m.round === round - 1)
      const matchesInThisRound = Math.ceil(previousRoundMatches.length / 2)
      
      // Obtener matches reales de esta ronda si existen
      const realMatchesThisRound = (matchesByRound[round] || []).sort((a, b) => a.id - b.id)
      
      for (let i = 0; i < matchesInThisRound; i++) {
        const match1Index = i * 2
        const match2Index = i * 2 + 1
        
        const match1 = previousRoundMatches[match1Index]
        const match2 = previousRoundMatches[match2Index]
        
        // Verificar si existe un match real para esta posición
        const realMatch = realMatchesThisRound[i]
        
        let newMatch
        
        if (realMatch) {
          // Usar el match real de la base de datos
          newMatch = {
            ...realMatch,
            bracketPosition: i,
            round
          }
        } else if (match2) {
          // Partido normal con dos ganadores previos (generado)
          const team1 = match1.winner_id 
            ? (match1.winner_id === match1.team1_id ? match1.team1 : match1.team2)
            : null
          const team2 = match2.winner_id 
            ? (match2.winner_id === match2.team1_id ? match2.team1 : match2.team2)
            : null
          
          newMatch = {
            id: `gen-${cycle}-r${round}-p${i}`,
            cycle,
            round,
            bracketPosition: i,
            team1_id: match1.winner_id || null,
            team2_id: match2.winner_id || null,
            team1: team1 || { name: 'TBD', course: '' },
            team2: team2 || { name: 'TBD', course: '' },
            winner_id: null,
            is_bye: false,
            isGenerated: true,
            sourceMatches: [match1.id, match2.id]
          }
        } else {
          // Pase automático (BYE) (generado)
          const team1 = match1.winner_id 
            ? (match1.winner_id === match1.team1_id ? match1.team1 : match1.team2)
            : null
          
          newMatch = {
            id: `gen-${cycle}-r${round}-bye-${i}`,
            cycle,
            round,
            bracketPosition: i,
            team1_id: match1.winner_id || null,
            team2_id: null,
            team1: team1 || { name: 'TBD', course: '' },
            team2: null,
            winner_id: match1.winner_id || null,
            is_bye: true,
            isGenerated: true,
            sourceMatches: [match1.id]
          }
        }
        
        bracketStructure.push(newMatch)
      }
    }
    
    return bracketStructure
  }



  const handleEditScore = (match) => {
    const isFinal = isFinalMatch(match, matches[match.cycle])
    const maxSets = match.cycle === 'basico' ? (isFinal ? finalFormat.basico : 1) : (isFinal ? finalFormat.superior : 3)
    
    setEditingMatch(match)
    setScoreForm({
      team1_sets: match.team1_sets || 0,
      team2_sets: match.team2_sets || 0,
      score_detail: match.score || '',
      sets: Array(maxSets).fill().map((_, i) => ({
        team1: 0,
        team2: 0
      }))
    })
  }

  const handleSaveScore = async () => {
    if (!editingMatch) return

    // Verificar que sea un match real de la base de datos
    if (typeof editingMatch.id === 'string') {
      alert('Este partido aún no está disponible. Complete los partidos anteriores primero.')
      return
    }

    setLoading(true)
    try {
      // Calcular sets ganados
      const team1_sets = scoreForm.sets.filter(set => set.team1 > set.team2).length
      const team2_sets = scoreForm.sets.filter(set => set.team2 > set.team1).length
      
      // Generar detalle del marcador
      const score_detail = scoreForm.sets
        .filter(set => set.team1 > 0 || set.team2 > 0)
        .map(set => `${set.team1}-${set.team2}`)
        .join(', ')
      
      // Determinar ganador
      let winner_id = null
      if (team1_sets > team2_sets) {
        winner_id = editingMatch.team1_id
      } else if (team2_sets > team1_sets) {
        winner_id = editingMatch.team2_id
      }

      // Actualizar partido
      const { error } = await supabase
        .from('matches')
        .update({
          team1_sets,
          team2_sets,
          score: score_detail,
          winner_id,
          completed_at: new Date().toISOString()
        })
        .eq('id', editingMatch.id)

      if (error) throw error

      // Actualizar siguiente ronda si es necesario
      if (winner_id) {
        await updateNextRound(editingMatch, winner_id)
        // Refrescar después de actualizar la siguiente ronda
        await fetchMatches()
      } else {
        await fetchMatches()
      }
      setEditingMatch(null)
      setScoreForm({ team1_sets: 0, team2_sets: 0, score_detail: '', sets: [] })
    } catch (error) {
      console.error('Error saving score:', error)
      alert('Error al guardar el resultado')
    } finally {
      setLoading(false)
    }
  }

  const updateNextRound = async (currentMatch, winnerId) => {
    try {
      const nextRound = currentMatch.round + 1
      
      // Obtener todos los matches de la ronda actual para determinar el pairing
      const { data: currentRoundMatches, error: currentError } = await supabase
        .from('matches')
        .select('*')
        .eq('cycle', currentMatch.cycle)
        .eq('round', currentMatch.round)
        .order('id')

      if (currentError) {
        console.error('Error fetching current round matches:', currentError)
        return
      }

      // Encontrar el índice del match actual
      const currentMatchIndex = currentRoundMatches.findIndex(m => m.id === currentMatch.id)
      if (currentMatchIndex === -1) return

      // Determinar cuál será el match de la siguiente ronda
      const nextMatchIndex = Math.floor(currentMatchIndex / 2)
      const isFirstTeamInPair = currentMatchIndex % 2 === 0

      // Buscar si ya existe un match en la siguiente ronda
      const { data: existingNextMatches, error: nextError } = await supabase
        .from('matches')
        .select('*')
        .eq('cycle', currentMatch.cycle)
        .eq('round', nextRound)
        .order('id')

      if (nextError) {
        console.error('Error fetching next round matches:', nextError)
        return
      }

      // Determinar el otro match del par
      const pairMatchIndex = isFirstTeamInPair ? currentMatchIndex + 1 : currentMatchIndex - 1
      const pairMatch = currentRoundMatches[pairMatchIndex]

      // Verificar si ya existe un match en la siguiente ronda para esta posición
      const existingMatch = existingNextMatches[nextMatchIndex]

      if (pairMatch && pairMatch.winner_id) {
        // Ambos matches del par están completos, crear o actualizar match normal
        const nextMatchData = {
          cycle: currentMatch.cycle,
          round: nextRound,
          is_bye: false,
          team1_id: isFirstTeamInPair ? winnerId : pairMatch.winner_id,
          team2_id: isFirstTeamInPair ? pairMatch.winner_id : winnerId
        }
        
        let createdOrUpdatedMatch
        
        if (existingMatch) {
          // Actualizar match existente
          const { data, error: updateError } = await supabase
            .from('matches')
            .update(nextMatchData)
            .eq('id', existingMatch.id)
            .select()
            .single()
          
          if (updateError) {
            console.error('Error updating match:', updateError)
          } else {
            createdOrUpdatedMatch = data
          }
        } else {
          // Crear nuevo match
          const { data, error: insertError } = await supabase
            .from('matches')
            .insert([nextMatchData])
            .select()
            .single()
          
          if (insertError) {
            console.error('Error inserting match:', insertError)
          } else {
            createdOrUpdatedMatch = data
          }
        }
      } else if (!pairMatch) {
        // No hay match par (número impar de equipos), crear BYE
        const nextMatchData = {
          cycle: currentMatch.cycle,
          round: nextRound,
          is_bye: true,
          team1_id: winnerId,
          team2_id: null,
          winner_id: winnerId,
          team1_sets: 1,
          team2_sets: 0,
          completed_at: new Date().toISOString() // Importante: marcar como completado
        }
        
        console.log('Creating BYE match:', nextMatchData)
        
        let createdOrUpdatedMatch
        
        if (existingMatch) {
          // Actualizar match existente
          const { data, error: updateError } = await supabase
            .from('matches')
            .update(nextMatchData)
            .eq('id', existingMatch.id)
            .select()
            .single()
          
          if (updateError) {
            console.error('Error updating BYE match:', updateError, nextMatchData)
          } else {
            createdOrUpdatedMatch = data
          }
        } else {
          // Crear nuevo match
          const { data, error: insertError } = await supabase
            .from('matches')
            .insert([nextMatchData])
            .select()
            .single()
          
          if (insertError) {
            console.error('Error inserting BYE match:', insertError, nextMatchData)
          } else {
            createdOrUpdatedMatch = data
          }
        }
        
        // Si se creó un BYE, procesarlo recursivamente para la siguiente ronda
        // pero sólo hasta la ronda máxima real del torneo, calculada a
        // partir de los partidos de la primera ronda (evita usar valores
        // residuales en la DB como rounds muy grandes de ejecuciones previas).
        const { data: firstRoundMatches = [], error: frError } = await supabase
          .from('matches')
          .select('*')
          .eq('cycle', currentMatch.cycle)
          .eq('round', 1)
          .order('id')

        if (frError) {
          console.error('Error fetching first round matches for maxRounds:', frError)
        }

        // Calcular número total de equipos a partir de la primera ronda
        const totalTeams = (firstRoundMatches || []).reduce((sum, m) => {
          if (m.is_bye) return sum + 1
          return sum + 2
        }, 0)

        const maxRounds = totalTeams > 0 ? Math.ceil(Math.log2(totalTeams)) : nextRound

        // Sólo recursar si el match creado está por debajo de la ronda final real
        if (createdOrUpdatedMatch &&
            createdOrUpdatedMatch.is_bye &&
            createdOrUpdatedMatch.winner_id &&
            createdOrUpdatedMatch.round < maxRounds) {
          await updateNextRound(createdOrUpdatedMatch, createdOrUpdatedMatch.winner_id)
        }
      }
      // Si el match par no está completo, no hacemos nada (esperamos a que se complete)

    } catch (error) {
      console.error('Error updating next round:', error)
    }
  }

  const getMatchStatus = (match) => {
    if (match.is_bye) return 'Pase automático'
    if (match.winner_id) return 'Completado'
    return 'Pendiente'
  }

  const getMatchStatusColor = (match) => {
    if (match.is_bye) return 'text-blue-400'
    if (match.winner_id) return 'text-green-400'
    return 'text-yellow-400'
  }

  const isFinalMatch = (match, allMatches) => {
    const cycleMatches = allMatches.filter(m => m.cycle === match.cycle)
    const maxRound = Math.max(...cycleMatches.map(m => m.round))
    return match.round === maxRound
  }

  const getRequiredSets = (match, allMatches) => {
    if (match.cycle === 'basico') {
      return isFinalMatch(match, allMatches) ? 3 : 1 // Final al mejor de 3, resto a 1 set
    } else {
      return isFinalMatch(match, allMatches) ? 5 : 3 // Final puede ser al mejor de 5, resto al mejor de 3
    }
  }

  const BracketView = ({ bracket, title, cycle }) => {
    return (
      <div className="card w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-text-primary flex items-center space-x-2">
            <Trophy size={24} />
            <span>{title}</span>
          </h3>
          
          {cycle === 'superior' && (
            <button
              onClick={() => setShowFormatModal(true)}
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <Settings size={16} />
              <span>Formato Final</span>
            </button>
          )}
        </div>

        {bracket.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay partidos configurados</p>
          </div>
        ) : (
          <div className="w-full">
            <TournamentBracket
              matches={bracket}
              cycle={cycle}
              onEditMatch={handleEditScore}
              finalFormat={finalFormat}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
            />
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Layout title="Administración de Llaves">
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Cargando llaves...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Administración de Llaves">
      <div className="space-y-6">
        <p className="text-text-secondary">
          Administra los resultados y avance de los torneos
        </p>

        {/* Selector de ciclo: mover control fuera del componente de llaves */}
        <div className="flex justify-center gap-4">
          <button
            className={`px-5 py-2 rounded-lg font-medium transition-all ${
              selectedCycle === 'basico' ? 'bg-accent text-white' : 'bg-light-gray/10 text-text-secondary hover:bg-light-gray/20'
            }`}
            onClick={() => setSelectedCycle('basico')}
          >
            Ciclo Básico
          </button>
          <button
            className={`px-5 py-2 rounded-lg font-medium transition-all ${
              selectedCycle === 'superior' ? 'bg-accent text-white' : 'bg-light-gray/10 text-text-secondary hover:bg-light-gray/20'
            }`}
            onClick={() => setSelectedCycle('superior')}
          >
            Ciclo Superior
          </button>
        </div>

        <div className="space-y-8">
          <div className={selectedCycle === 'basico' ? 'block' : 'hidden'}>
            <BracketView 
              bracket={matches.basico} 
              title="Ciclo Básico" 
              cycle="basico"
            />
          </div>
          <div className={selectedCycle === 'superior' ? 'block' : 'hidden'}>
            <BracketView 
              bracket={matches.superior} 
              title="Ciclo Superior" 
              cycle="superior"
            />
          </div>
        </div>

        {/* Modal para editar resultado */}
        {editingMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-gray rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text-primary">
                  Editar Resultado
                </h3>
                <button
                  onClick={() => setEditingMatch(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center text-text-secondary text-sm">
                  {editingMatch.team1?.name} vs {editingMatch.team2?.name}
                </div>
                
                {/* Marcador por sets */}
                <div className="space-y-3">
                  <h4 className="font-medium text-text-primary">Resultado por sets</h4>
                  {scoreForm.sets.map((set, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Set {index + 1} - {editingMatch.team1?.name}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          className="input w-full text-sm"
                          value={set.team1}
                          onChange={(e) => {
                            const newSets = [...scoreForm.sets]
                            newSets[index].team1 = parseInt(e.target.value) || 0
                            setScoreForm({ ...scoreForm, sets: newSets })
                          }}
                        />
                      </div>
                      <div className="text-center text-text-secondary text-sm">vs</div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Set {index + 1} - {editingMatch.team2?.name}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          className="input w-full text-sm"
                          value={set.team2}
                          onChange={(e) => {
                            const newSets = [...scoreForm.sets]
                            newSets[index].team2 = parseInt(e.target.value) || 0
                            setScoreForm({ ...scoreForm, sets: newSets })
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Resumen de sets ganados */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-medium-gray rounded">
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">Sets ganados</div>
                    <div className="text-lg font-bold text-accent">
                      {scoreForm.sets.filter(set => set.team1 > set.team2).length}
                    </div>
                    <div className="text-sm">{editingMatch.team1?.name}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">Sets ganados</div>
                    <div className="text-lg font-bold text-accent">
                      {scoreForm.sets.filter(set => set.team2 > set.team1).length}
                    </div>
                    <div className="text-sm">{editingMatch.team2?.name}</div>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setEditingMatch(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveScore}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para configurar formato de final */}
        {showFormatModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-gray rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text-primary">
                  Formato de Final - Ciclo Superior
                </h3>
                <button
                  onClick={() => setShowFormatModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-text-secondary text-sm">
                  Selecciona el formato para la final del ciclo superior:
                </p>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="finalFormat"
                      value="3"
                      checked={finalFormat.superior === 3}
                      onChange={() => setFinalFormat(prev => ({ ...prev, superior: 3 }))}
                      className="text-accent"
                    />
                    <span className="text-text-primary">Al mejor de 3 sets</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="finalFormat"
                      value="5"
                      checked={finalFormat.superior === 5}
                      onChange={() => setFinalFormat(prev => ({ ...prev, superior: 5 }))}
                      className="text-accent"
                    />
                    <span className="text-text-primary">Al mejor de 5 sets</span>
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowFormatModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setShowFormatModal(false)}
                    className="btn-primary flex-1"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Llaves