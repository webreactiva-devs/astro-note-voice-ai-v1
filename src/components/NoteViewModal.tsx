import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Calendar, Tag, Edit, Trash2 } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  organizedContent: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface NoteViewModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteViewModal({
  note,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: NoteViewModalProps) {
  if (!note) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = () => {
    onEdit(note);
    onClose();
  };

  const handleDelete = () => {
    onDelete(note);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold leading-tight">
            {note.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Creada el {formatDate(note.createdAt)}
            </span>
            {note.createdAt !== note.updatedAt && (
              <span>• Editada el {formatDate(note.updatedAt)}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Organized Content */}
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium">Nota procesada</h4>
            <div className="p-4 bg-muted/50 rounded-lg border max-h-[400px] overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {note.organizedContent || "No hay contenido organizado por IA."}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Transcripción original</h4>
            <div className="p-4 bg-muted/50 rounded-lg border max-h-[400px] overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="outline" onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
