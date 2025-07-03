import { useState, useEffect } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { LazyNoteViewModal, LazyNoteEditModal } from './LazyModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { useToast } from '@/lib/hooks/useToast'
import { Search, Filter, Calendar, Tag, Edit, Trash2, Eye } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface NotesResponse {
  success: boolean
  notes: Note[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [error, setError] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const toast = useToast()

  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedTag) params.append('tag', selectedTag)
      params.append('limit', '50')
      params.append('offset', '0')

      const response = await fetch(`/api/notes?${params.toString()}`)
      
      if (response.ok) {
        const data: NotesResponse = await response.json()
        setNotes(data.notes)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error loading notes')
        setNotes([])
      }
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError('Error connecting to server')
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  // Load notes on component mount and when filters change
  useEffect(() => {
    fetchNotes()
  }, [searchTerm, selectedTag])

  // Get all unique tags from notes
  const allTags = Array.from(
    new Set(notes.flatMap(note => note.tags))
  ).sort()

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTag('')
  }

  // Handle note actions
  const handleViewNote = (note: Note) => {
    setSelectedNote(note)
    setShowViewModal(true)
  }

  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setShowEditModal(true)
  }

  const handleSaveNote = async (noteId: string, updatedNote: { title: string; content: string; tags: string[] }) => {
    const toastId = await toast.loading('Guardando cambios...')
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote)
      })

      await toast.dismiss(toastId)

      if (response.ok) {
        const result = await response.json()
        // Update the note in the local state
        setNotes(prev => prev.map(note => 
          note.id === noteId ? result.note : note
        ))
        await toast.success('Nota actualizada exitosamente')
      } else {
        const error = await response.json()
        await toast.error(`Error: ${error.error}`)
      }
    } catch (error) {
      await toast.dismiss(toastId)
      console.error('Error updating note:', error)
      await toast.error('Error al actualizar la nota')
    }
  }

  const handleDeleteClick = (note: Note) => {
    setSelectedNote(note)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedNote) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove the note from local state
        setNotes(prev => prev.filter(note => note.id !== selectedNote.id))
        await toast.success('Nota eliminada exitosamente')
        setShowDeleteConfirm(false)
      } else {
        const error = await response.json()
        await toast.error(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      await toast.error('Error al eliminar la nota')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm"
            >
              <option value="">Todos los tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          {/* Clear Filters Button */}
          {(searchTerm || selectedTag) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {loading ? 'Cargando...' : `${notes.length} nota${notes.length !== 1 ? 's' : ''} encontrada${notes.length !== 1 ? 's' : ''}`}
        </span>
        {(searchTerm || selectedTag) && (
          <span>
            Filtrado por: {searchTerm && `"${searchTerm}"`} {searchTerm && selectedTag && ', '} {selectedTag && `tag: ${selectedTag}`}
          </span>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchNotes} variant="outline" className="mt-4">
            Intentar de nuevo
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded w-12"></div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Notes Grid */}
      {!loading && !error && notes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <h3 
                    className="font-semibold text-lg leading-tight line-clamp-2 cursor-pointer hover:text-primary"
                    onClick={() => handleViewNote(note)}
                  >
                    {note.title}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewNote(note)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content Preview */}
                <p 
                  className="text-sm text-muted-foreground line-clamp-3 cursor-pointer"
                  onClick={() => handleViewNote(note)}
                >
                  {note.content}
                </p>

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs cursor-pointer hover:bg-secondary/80"
                        onClick={() => setSelectedTag(tag)}
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        +{note.tags.length - 3} más
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(note.createdAt)}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditNote(note)}
                      title="Editar nota"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(note)}
                      title="Eliminar nota"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && notes.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || selectedTag ? 'No se encontraron notas' : 'No tienes notas aún'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedTag 
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'Comienza grabando tu primera nota de voz'
                }
              </p>
            </div>
            {!searchTerm && !selectedTag && (
              <Button asChild>
                <a href="/record">Grabar Primera Nota</a>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Modals */}
      {showViewModal && (
        <LazyNoteViewModal
          note={selectedNote}
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          onEdit={handleEditNote}
          onDelete={(note) => handleDeleteClick(notes.find(n => n.id === note)!)}
        />
      )}

      {showEditModal && (
        <LazyNoteEditModal
          note={selectedNote}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveNote}
        />
      )}

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar nota?"
        description="Esta acción eliminará permanentemente la nota y no se puede deshacer."
        itemName={selectedNote?.title}
        isLoading={isDeleting}
      />

    </div>
  )
}