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
import { Textarea } from './ui/textarea'
import { Save, Edit3, Check, X } from 'lucide-react'

interface TranscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  transcription: string
  onSave: (editedTranscription: string) => Promise<void>
}

export function TranscriptionModal({ 
  isOpen, 
  onClose, 
  transcription, 
  onSave 
}: TranscriptionModalProps) {
  const [editedText, setEditedText] = useState(transcription)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update editedText when transcription prop changes
  useEffect(() => {
    setEditedText(transcription)
  }, [transcription])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editedText)
      onClose()
    } catch (error) {
      console.error('Error saving transcription:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedText(transcription) // Reset to original
    setIsEditing(false)
  }

  const handleConfirmEdit = () => {
    setIsEditing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transcripción de Audio
            {isEditing && (
              <span className="text-sm text-muted-foreground font-normal">
                (Editando)
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Puedes editar la transcripción para corregir errores antes de guardarla como nota."
              : "Resultado de la transcripción automática. Puedes editarla antes de guardar."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Edita aquí la transcripción..."
                className="min-h-[200px] resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmEdit}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Confirmar
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg border min-h-[200px] max-h-[300px] overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {editedText || 'No se pudo transcribir el audio...'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cerrar
          </Button>
          
          {!isEditing ? (
            <Button
              variant="outline"
              onClick={handleEdit}
              disabled={isSaving}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Editar
            </Button>
          ) : null}

          <Button
            onClick={handleSave}
            disabled={isSaving || !editedText.trim()}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar como Nota'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}