import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Users, Upload, HelpCircle, Copy, X } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'

const Teams = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    course: ''
  })
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  const courses = [
    '1ro A', '1ro B', '1ro C',
    '2do A', '2do B', '2do C',
    '3ro A', '3ro B', '3ro C',
    '4to 1ra', '4to 2da',
    '5to 1ra', '5to 2da',
    '6to 1ra', '6to 2da',
    '7mo 1ra', '7mo 2da'
  ]

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('course', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingTeam) {
        const { error } = await supabase
          .from('teams')
          .update(formData)
          .eq('id', editingTeam.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('teams')
          .insert([formData])
        
        if (error) throw error
      }

      await fetchTeams()
      setShowModal(false)
      setEditingTeam(null)
      setFormData({ name: '', course: '' })
    } catch (error) {
      console.error('Error saving team:', error)
    }
  }

  const handleEdit = (team) => {
    setEditingTeam(team)
    setFormData({ name: team.name, course: team.course })
    setShowModal(true)
  }

  const handleDelete = async (teamId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este equipo?')) return

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error
      await fetchTeams()
    } catch (error) {
      console.error('Error deleting team:', error)
    }
  }

  const handleImportJSON = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)

      // Validar que sea un array
      if (!Array.isArray(jsonData)) {
        alert('El archivo JSON debe contener un array de equipos')
        return
      }

      // Validar estructura de cada equipo
      const validTeams = jsonData.filter(team => {
        return team.name && team.course && courses.includes(team.course)
      })

      if (validTeams.length === 0) {
        alert('No se encontraron equipos válidos en el archivo')
        return
      }

      // Insertar equipos
      const { error } = await supabase
        .from('teams')
        .insert(validTeams)

      if (error) throw error

      await fetchTeams()
      alert(`Se importaron ${validTeams.length} equipos correctamente`)
    } catch (error) {
      console.error('Error importing JSON:', error)
      alert('Error al importar el archivo JSON. Verifica el formato.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCopyJSON = () => {
    const exampleJSON = JSON.stringify([
      { "name": "Equipo 1A", "course": "1ro A" },
      { "name": "Equipo 1B", "course": "1ro B" },
      { "name": "Equipo 1C", "course": "1ro C" },
      { "name": "Equipo 2A", "course": "2do A" },
      { "name": "Equipo 2B", "course": "2do B" },
      { "name": "Equipo 2C", "course": "2do C" },
      { "name": "Equipo 3A", "course": "3ro A" },
      { "name": "Equipo 3B", "course": "3ro B" },
      { "name": "Equipo 3C", "course": "3ro C" },
      { "name": "Equipo 4-1", "course": "4to 1ra" },
      { "name": "Equipo 4-2", "course": "4to 2da" },
      { "name": "Equipo 5-1", "course": "5to 1ra" },
      { "name": "Equipo 5-2", "course": "5to 2da" },
      { "name": "Equipo 6-1", "course": "6to 1ra" },
      { "name": "Equipo 6-2", "course": "6to 2da" },
      { "name": "Equipo 7-1", "course": "7mo 1ra" },
      { "name": "Equipo 7-2", "course": "7mo 2da" }
    ], null, 2)
    
    navigator.clipboard.writeText(exampleJSON)
    alert('JSON copiado al portapapeles')
  }

  const getCycleType = (course) => {
    const basicoCourses = ['1ro A', '1ro B', '1ro C', '2do A', '2do B', '2do C', '3ro A', '3ro B', '3ro C']
    return basicoCourses.includes(course) ? 'Ciclo Básico' : 'Ciclo Superior'
  }

  const groupedTeams = teams.reduce((acc, team) => {
    const cycle = getCycleType(team.course)
    if (!acc[cycle]) acc[cycle] = []
    acc[cycle].push(team)
    return acc
  }, {})

  if (loading) {
    return (
      <Layout title="Equipos">
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Cargando equipos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Gestión de Equipos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <p className="text-text-secondary text-sm sm:text-base">
            Administra los equipos participantes en el torneo
          </p>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowHelpModal(true)}
              className="btn-secondary flex items-center space-x-2 flex-1 sm:flex-initial justify-center"
            >
              <HelpCircle size={16} />
              <span className="hidden sm:inline">Formato JSON</span>
              <span className="sm:hidden">Info</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="btn-secondary flex items-center space-x-2 flex-1 sm:flex-initial justify-center"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">{importing ? 'Importando...' : 'Importar JSON'}</span>
              <span className="sm:hidden">{importing ? 'Importando...' : 'Importar'}</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center space-x-2 flex-1 sm:flex-initial justify-center"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Agregar Equipo</span>
              <span className="sm:hidden">Agregar</span>
            </button>
          </div>
        </div>

        {Object.entries(groupedTeams).map(([cycle, cycleTeams]) => (
          <div key={cycle} className="card">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center space-x-2">
              <Users size={20} />
              <span>{cycle}</span>
              <span className="text-sm font-normal text-text-secondary">
                ({cycleTeams.length} equipos)
              </span>
            </h2>
            
            {cycleTeams.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay equipos registrados en este ciclo</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {cycleTeams.map((team) => (
                  <div key={team.id} className="bg-medium-gray rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-text-primary">
                        {team.name}
                        <span className="text-text-secondary text-sm ml-2">
                          ({team.course})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(team)}
                        className="p-2 text-text-secondary hover:text-accent transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
                        className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Modal de Ayuda */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-gray rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text-primary">
                  Formato JSON para Importar Equipos
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Estructura del JSON</h4>
                  <p className="text-text-secondary text-sm mb-3">
                    El archivo debe ser un array de objetos, donde cada objeto representa un equipo con las propiedades <code className="bg-medium-gray px-1 rounded">name</code> y <code className="bg-medium-gray px-1 rounded">course</code>.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Cursos Válidos</h4>
                  <div className="bg-medium-gray rounded p-3 mb-3">
                    <p className="text-sm text-text-secondary mb-2">Ciclo Básico:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['1ro A', '1ro B', '1ro C', '2do A', '2do B', '2do C', '3ro A', '3ro B', '3ro C'].map(course => (
                        <span key={course} className="bg-ultra-dark px-2 py-1 rounded text-xs text-accent">
                          {course}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-text-secondary mb-2">Ciclo Superior:</p>
                    <div className="flex flex-wrap gap-2">
                      {['4to 1ra', '4to 2da', '5to 1ra', '5to 2da', '6to 1ra', '6to 2da', '7mo 1ra', '7mo 2da'].map(course => (
                        <span key={course} className="bg-ultra-dark px-2 py-1 rounded text-xs text-accent">
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-text-primary">Ejemplo Completo</h4>
                    <button
                      onClick={handleCopyJSON}
                      className="btn-secondary flex items-center space-x-2 text-xs"
                    >
                      <Copy size={14} />
                      <span>Copiar</span>
                    </button>
                  </div>
                  <pre className="bg-ultra-dark rounded p-4 text-xs text-text-secondary overflow-x-auto">
{`[
  { "name": "Equipo 1A", "course": "1ro A" },
  { "name": "Equipo 1B", "course": "1ro B" },
  { "name": "Equipo 1C", "course": "1ro C" },
  { "name": "Equipo 2A", "course": "2do A" },
  { "name": "Equipo 2B", "course": "2do B" },
  { "name": "Equipo 2C", "course": "2do C" },
  { "name": "Equipo 3A", "course": "3ro A" },
  { "name": "Equipo 3B", "course": "3ro B" },
  { "name": "Equipo 3C", "course": "3ro C" },
  { "name": "Equipo 4-1", "course": "4to 1ra" },
  { "name": "Equipo 4-2", "course": "4to 2da" },
  { "name": "Equipo 5-1", "course": "5to 1ra" },
  { "name": "Equipo 5-2", "course": "5to 2da" },
  { "name": "Equipo 6-1", "course": "6to 1ra" },
  { "name": "Equipo 6-2", "course": "6to 2da" },
  { "name": "Equipo 7-1", "course": "7mo 1ra" },
  { "name": "Equipo 7-2", "course": "7mo 2da" }
]`}
                  </pre>
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded p-3">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-accent">Nota:</strong> Solo se importarán los equipos que tengan un nombre válido y un curso que coincida exactamente con los cursos permitidos.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="btn-primary"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-gray rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-text-primary mb-4">
                {editingTeam ? 'Editar Equipo' : 'Agregar Equipo'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Nombre del Equipo
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: EquipoG"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Curso
                  </label>
                  <select
                    required
                    className="input w-full"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  >
                    <option value="">Seleccionar curso</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTeam(null)
                      setFormData({ name: '', course: '' })
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingTeam ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Teams