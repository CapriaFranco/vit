import { useMemo, useState } from 'react'

const TournamentBracket = ({ matches, cycle, onEditMatch, finalFormat, zoomLevel: zoomLevelProp, setZoomLevel: setZoomLevelProp }) => {
  // Estado interno de zoom si la página no lo provee
  const [internalZoom, setInternalZoom] = useState(0.9)
  const zoomLevel = typeof zoomLevelProp === 'number' ? zoomLevelProp : internalZoom
  const setZoomLevel = typeof setZoomLevelProp === 'function' ? setZoomLevelProp : setInternalZoom
  // El ciclo se recibe desde la página (prop `cycle`)

  // Constantes base
  const BASE_MATCH_HEIGHT = 150
  const BASE_MATCH_GAP = 20
  const BASE_CONNECTOR_WIDTH = 75
  const BASE_ROUND_GAP = 0

  // Constantes ajustadas con zoom
  const MATCH_HEIGHT = BASE_MATCH_HEIGHT
  const MATCH_GAP = BASE_MATCH_GAP
  const CONNECTOR_WIDTH = BASE_CONNECTOR_WIDTH
  const ROUND_GAP = BASE_ROUND_GAP

  // Organizar y transformar los datos
  const bracketData = useMemo(() => {
    if (!matches || matches.length === 0) return { rounds: [] }

    const roundsMap = matches.reduce((acc, match) => {
      if (!acc[match.round]) acc[match.round] = []
      acc[match.round].push(match)
      return acc
    }, {})

    const roundNumbers = Object.keys(roundsMap).map(Number).sort((a, b) => a - b)
    const maxRound = Math.max(...roundNumbers, 0)

    const getRequiredSets = (match) => {
      const isFinal = match.round === maxRound
      if (cycle === 'basico') {
        return isFinal ? finalFormat.basico : 1
      } else {
        return isFinal ? finalFormat.superior : 3
      }
    }

    const parseScore = (scoreString) => {
      if (!scoreString) return []
      return scoreString.split(',').map(s => {
        const [t1, t2] = s.trim().split('-').map(n => parseInt(n) || 0)
        return { team1: t1, team2: t2 }
      })
    }

    const getRoundName = (roundNum, totalRounds) => {
      const roundsFromEnd = totalRounds - roundNum
      
      if (roundsFromEnd === 0) return 'FINAL'
      if (roundsFromEnd === 1) return 'SEMIFINALES'
      if (roundsFromEnd === 2) return 'CUARTOS DE FINAL'
      if (roundsFromEnd === 3) return 'OCTAVOS DE FINAL'
      if (roundsFromEnd === 4) return 'DIECISEISAVOS'
      
      return `Ronda ${roundNum}`
    }

    return {
      rounds: roundNumbers.map(roundNum => {
        const roundMatches = roundsMap[roundNum].sort((a, b) => {
          if (a.bracketPosition !== undefined && b.bracketPosition !== undefined) {
            return a.bracketPosition - b.bracketPosition
          }
          return (a.id || 0) - (b.id || 0)
        })
        
        const totalRounds = roundNumbers.length

        return {
          roundNum,
          title: getRoundName(roundNum, totalRounds),
          matches: roundMatches.map(match => {
            const requiredSets = getRequiredSets(match)
            const scores = parseScore(match.score)
            // Determinar si es un partido sin oponente (BYE)
            const hasNoOpponent = !match.team2 || match.is_bye

            // Manejar los scores según la situación
            let matchScores
            if (hasNoOpponent) {
              // Para cualquier partido sin oponente (BYE)
              matchScores = Array(requiredSets).fill({ team1: 1, team2: 0 })
            } else if (!match.score || match.score === '') {
              // Partido sin scores
              matchScores = Array(requiredSets).fill({ team1: 0, team2: 0 })
            } else {
              // Usar los scores existentes
              matchScores = parseScore(match.score)
            }

            return {
              ...match,
              requiredSets,
              scores: matchScores,
              hasNoOpponent,
              isWinner1: hasNoOpponent ? true : match.winner_id === match.team1_id,
              isWinner2: !hasNoOpponent && match.winner_id === match.team2_id,
            }
          })
        }
      })
    }
  }, [matches, cycle, finalFormat])

  const MatchCard = ({ match }) => {
    const { requiredSets, scores, hasNoOpponent, isWinner1, isWinner2 } = match
    
    const canEdit = match.team1 && match.team2 && 
                    match.team1.name !== 'TBD' && match.team2.name !== 'TBD' &&
                    match.team1_id && match.team2_id &&
                    typeof match.id === 'number' &&
                    !match.is_bye

    return (
      <div 
        className={`bg-medium-gray rounded-lg border-2 border-light-gray transition-all duration-200 overflow-hidden shadow-lg h-full ${
          canEdit ? 'cursor-pointer hover:border-accent hover:shadow-accent/30 hover:scale-[1.02]' : ''
        }`}
        onClick={() => canEdit && onEditMatch(match)}
      >
        {hasNoOpponent ? (
          <div className="h-full flex flex-col">
            {/* Equipo que avanza */}
            <div className="flex items-center justify-between p-3 border-b-2 border-light-gray/30 bg-accent/10 border-l-4 border-accent flex-1">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-text-primary text-sm truncate">
                  {match.team1?.name || '──────────'}
                </div>
                <div className="text-xs text-text-secondary leading-tight">
                  {match.team1?.course || '──────────'}
                </div>
              </div>
              <div className="flex space-x-1">
                {Array(requiredSets).fill().map((_, i) => (
                  <div 
                    key={i} 
                    className="w-9 h-9 rounded bg-accent text-white text-xs flex items-center justify-center font-bold"
                  >
                    1
                  </div>
                ))}
              </div>
            </div>

            {/* Sin equipo */}
            <div className="flex items-center justify-between p-3 flex-1">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-text-secondary text-sm italic">
                  Sin equipo
                </div>
                <div className="text-xs text-text-secondary/50 leading-tight">
                  BYE
                </div>
              </div>
              <div className="flex space-x-1">
                {Array(requiredSets).fill().map((_, i) => (
                  <div 
                    key={i} 
                    className="w-9 h-9 rounded bg-ultra-dark text-text-secondary/50 border-2 border-light-gray/20 text-xs flex items-center justify-center font-bold"
                  >
                    0
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Equipo 1 */}
            <div className={`flex items-center justify-between p-3 flex-1 ${
              isWinner1 ? 'bg-accent/10 border-l-4 border-accent' : ''
            }`}>
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-text-primary text-sm truncate">
                  {!match.team1 || match.team1?.name === 'TBD' || !match.team1?.name ? '──────────' : match.team1.name}
                </div>
                <div className="text-xs text-text-secondary leading-tight">
                  {match.team1?.course && match.team1?.name !== 'TBD' && match.team1?.name ? match.team1.course : '──────────'}
                </div>
              </div>
              <div className="flex space-x-1">
                {Array(requiredSets).fill().map((_, i) => {
                  const setScore = scores[i]
                  const won = setScore && setScore.team1 > setScore.team2
                  return (
                    <div 
                      key={i} 
                      className={`w-9 h-9 rounded text-xs flex items-center justify-center font-bold ${
                        won
                          ? 'bg-accent text-white' 
                          : 'bg-ultra-dark text-text-secondary border-2 border-light-gray/20'
                      }`}
                    >
                      {setScore ? setScore.team1 : 0}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Equipo 2 */}
            <div className={`flex items-center justify-between p-3 flex-1 ${
              isWinner2 ? 'bg-accent/10 border-l-4 border-accent' : ''
            }`}>
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-text-primary text-sm truncate">
                  {!match.team2 || match.team2?.name === 'TBD' || !match.team2?.name ? '──────────' : match.team2.name}
                </div>
                <div className="text-xs text-text-secondary leading-tight">
                  {match.team2?.course && match.team2?.name !== 'TBD' && match.team2?.name ? match.team2.course : '──────────'}
                </div>
              </div>
              <div className="flex space-x-1">
                {Array(requiredSets).fill().map((_, i) => {
                  const setScore = scores[i]
                  const won = setScore && setScore.team2 > setScore.team1
                  return (
                    <div 
                      key={i} 
                      className={`w-9 h-9 rounded text-xs flex items-center justify-center font-bold ${
                        won
                          ? 'bg-accent text-white' 
                          : 'bg-ultra-dark text-text-secondary border-2 border-light-gray/20'
                      }`}
                    >
                      {setScore ? setScore.team2 : 0}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No hay partidos configurados</p>
      </div>
    )
  }

  // Calcular la altura total necesaria para el bracket
  const firstRound = bracketData.rounds[0]
  const totalBracketHeight = firstRound 
    ? firstRound.matches.length * (MATCH_HEIGHT + MATCH_GAP * 2) 
    : 0

  // Calcular el ancho total necesario
  const totalWidth = bracketData.rounds.length * 380 + 
                    (bracketData.rounds.length - 1) * CONNECTOR_WIDTH

  return (
    <div className="w-full">
      {/* Controles de zoom siempre visibles */}
      <div className="sticky top-0 z-50 bg-ultra-dark p-4 border-b border-light-gray/20 flex items-center justify-center gap-4 w-full">
        <button
          className="bg-accent hover:bg-accent/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
          onClick={() => setZoomLevel(z => Math.min(z + 0.1, 1.2))}
        >
          +
        </button>
        <span className="text-text-primary text-sm">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          className="bg-accent hover:bg-accent/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
          onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))}
        >
          -
        </button>
      </div>

      <div className="tournament-bracket-container overflow-x-auto">
        <svg
          className="w-full"
          viewBox={`0 0 ${totalWidth} ${totalBracketHeight + 100}`}
          style={{
            minWidth: `${totalWidth * zoomLevel}px`,
            height: 'auto'
          }}
        >
          <foreignObject width={totalWidth} height={totalBracketHeight + 100}>
            <div 
              className="flex h-full"
              style={{ 
                gap: `${CONNECTOR_WIDTH + ROUND_GAP}px`
              }}
            >
              {bracketData.rounds.map((round, roundIndex) => {
                // Calcular el espaciado vertical para esta ronda
                const spacingMultiplier = Math.pow(2, roundIndex)
                const verticalSpacing = (MATCH_HEIGHT + MATCH_GAP) * spacingMultiplier
                
                return (
                  <div 
                    key={round.roundNum} 
                    className="relative flex-shrink-0 flex flex-col" 
                    style={{ 
                      width: '380px',
                      minWidth: '380px'
                    }}
                  >
                    {/* Título de la ronda */}
                    <div className="mb-6">
                      <h3 className="text-center font-bold text-accent text-sm uppercase tracking-wider border-b-2 border-accent pb-2">
                        {round.title}
                      </h3>
                    </div>
                    
                    {/* Contenedor de partidos con altura calculada */}
                    <div 
                      className="relative flex-1"
                      style={{ minHeight: `${totalBracketHeight}px` }}
                    >
                      {round.matches.map((match, matchIndex) => {
                        // Calcular posición Y: centro del espacio asignado menos la mitad de la altura
                        const centerY = matchIndex * verticalSpacing + (verticalSpacing / 2)
                        const topPosition = centerY - (MATCH_HEIGHT / 2)
                        
                        return (
                          <div 
                            key={match.id} 
                            className="absolute left-0 right-0"
                            style={{ 
                              top: `${topPosition}px`,
                              height: `${MATCH_HEIGHT}px`
                            }}
                          >
                            <MatchCard match={match} />
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* SVG para las líneas conectoras */}
                    {roundIndex < bracketData.rounds.length - 1 && (
                      <svg 
                        className="absolute pointer-events-none"
                        style={{ 
                          left: '100%',
                          top: '52px', // Offset del título (mb-6 = 24px + altura título ~28px)
                          width: `${CONNECTOR_WIDTH}px`,
                          height: `${totalBracketHeight}px`,
                          overflow: 'visible'
                        }}
                      >
                        {round.matches.map((match, matchIndex) => {
                          // Solo dibujar conectores para partidos pares (el primero de cada par)
                          if (matchIndex % 2 !== 0) return null
                          
                          const currentCenterY = matchIndex * verticalSpacing + (verticalSpacing / 2)
                          const nextMatchIndex = Math.floor(matchIndex / 2)
                          const nextVerticalSpacing = verticalSpacing * 2
                          const nextCenterY = nextMatchIndex * nextVerticalSpacing + (nextVerticalSpacing / 2)
                          
                          const midX = CONNECTOR_WIDTH / 2
                          const hasSecondMatch = matchIndex + 1 < round.matches.length
                          
                          if (hasSecondMatch) {
                            // Par completo: dibujar conexión en forma de Y
                            const secondCenterY = (matchIndex + 1) * verticalSpacing + (verticalSpacing / 2)
                            
                            return (
                              <g key={`connector-${match.id}`}>
                                {/* Línea horizontal desde el primer partido */}
                                <line
                                  x1="0"
                                  y1={currentCenterY}
                                  x2={midX}
                                  y2={currentCenterY}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                />
                                
                                {/* Línea horizontal desde el segundo partido */}
                                <line
                                  x1="0"
                                  y1={secondCenterY}
                                  x2={midX}
                                  y2={secondCenterY}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                />
                                
                                {/* Línea vertical conectando ambos */}
                                <line
                                  x1={midX}
                                  y1={currentCenterY}
                                  x2={midX}
                                  y2={secondCenterY}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                />
                                
                                {/* Línea horizontal hacia el siguiente partido */}
                                <line
                                  x1={midX}
                                  y1={nextCenterY}
                                  x2={CONNECTOR_WIDTH + 5}
                                  y2={nextCenterY}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                />
                                
                                {/* Círculo en el punto de unión */}
                                <circle
                                  cx={midX}
                                  cy={nextCenterY}
                                  r="5"
                                  fill="#3b82f6"
                                />
                              </g>
                            )
                          } else {
                            // Partido BYE (sin pareja): línea horizontal y vertical
                            return (
                              <g key={`connector-${match.id}`}>
                                {/* Línea horizontal desde el partido */}
                                <line
                                  x1="0"
                                  y1={currentCenterY}
                                  x2={midX}
                                  y2={currentCenterY}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                />
                                
                                {/* Línea vertical hacia donde estaría el siguiente partido */}
                                <line
                                  x1={midX}
                                  y1={currentCenterY}
                                  x2={midX}
                                  y2={nextCenterY}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                />
                                
                                {/* Círculo en el punto de conexión */}
                                <circle
                                  cx={midX}
                                  cy={nextCenterY}
                                  r="5"
                                  fill="#3b82f6"
                                />

                                {/* Línea horizontal hacia el siguiente partido */}
                                <line
                                  x1={midX}
                                  y1={nextCenterY}
                                  x2={CONNECTOR_WIDTH + 5}
                                  y2={nextCenterY}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                />
                              </g>
                            )
                          }
                        })}
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          </foreignObject>
        </svg>
      </div>
    </div>
  )
}

export default TournamentBracket
