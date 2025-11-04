import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TournamentBracket from '../components/TournamentBracket'
import logoTransparent from '../assets/img/vit-logo-transparent.png'

const Home = () => {
  const [matches, setMatches] = useState({ basico: [], superior: [] })
  const [loading, setLoading] = useState(true)
  const [selectedCycle, setSelectedCycle] = useState('basico')
  const [zoomLevel, setZoomLevel] = useState(0.9)

  useEffect(() => {
    fetchMatches()
  }, [])

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

  const BracketView = ({ bracket, title, cycle }) => {
    return (
      <div className="card w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary flex items-center space-x-2">
            <Trophy size={20} className="sm:w-6 sm:h-6" />
            <span>{title}</span>
          </h3>
        </div>

        {bracket.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-text-secondary">
            <Trophy size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm sm:text-base">No hay partidos configurados</p>
          </div>
        ) : (
          <div className="w-full">
            <TournamentBracket
              matches={bracket}
              cycle={cycle}
              onEditMatch={null}
              finalFormat={{ basico: 3, superior: 5 }}
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
      <div className="min-h-screen flex items-center justify-center bg-ultra-dark">
        <div className="text-text-secondary">Cargando llaves...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ultra-dark">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-2 sm:px-4 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <img 
              src={logoTransparent} 
              alt="Logo VIT" 
              className="h-20 sm:h-24 lg:h-32 w-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-text-primary mb-2 sm:mb-4 bg-gradient-to-r from-text-primary via-accent to-text-primary bg-clip-text text-transparent px-2">
            Sistema de Eliminación Directa
          </h1>
        </div>

        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Selector de ciclo (fuera del componente) */}
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
      </div>
    </div>
  )
}

export default Home