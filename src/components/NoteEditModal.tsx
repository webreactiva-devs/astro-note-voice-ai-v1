import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Save, X } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface NoteEditModalProps {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onSave: (noteId: string, updatedNote: { title: string; content: string; tags: string[] }) => Promise<void>
}

export function NoteEditModal({ 
  note, 
  isOpen, 
  onClose, 
  onSave 
}: NoteEditModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Update form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTagsInput(note.tags.join(', '))
    }
  }, [note])

  if (!note) return null

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('El título y el contenido son obligatorios')
      return
    }

    setIsSaving(true)
    try {
      // Parse tags from comma-separated string
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      await onSave(note.id, {
        title: title.trim(),
        content: content.trim(),
        tags
      })
      
      onClose()
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Error al guardar la nota')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTagsInput(note.tags.join(', '))
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Nota</DialogTitle>
          <DialogDescription>
            Modifica el título, contenido y tags de tu nota.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la nota..."
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Contenido
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contenido de la nota..."
              className="min-h-[200px] resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tag1, tag2, tag3..."
            />
            <p className="text-xs text-muted-foreground">
              Separa los tags con comas. Ejemplo: trabajo, ideas, importante
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}