import { lazy, Suspense } from 'react'
import { Dialog, DialogContent } from './ui/dialog'

// Lazy load modal components
const TranscriptionModal = lazy(() => import('./TranscriptionModal').then(m => ({ default: m.TranscriptionModal })))
const NoteEditModal = lazy(() => import('./NoteEditModal').then(m => ({ default: m.NoteEditModal })))
const NoteViewModal = lazy(() => import('./NoteViewModal').then(m => ({ default: m.NoteViewModal })))

// Loading fallback
const ModalLoading = () => (
  <Dialog open={true}>
    <DialogContent className="max-w-2xl">
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    </DialogContent>
  </Dialog>
)

// Lazy wrapped components
export const LazyTranscriptionModal = (props: any) => (
  <Suspense fallback={<ModalLoading />}>
    <TranscriptionModal {...props} />
  </Suspense>
)

export const LazyNoteEditModal = (props: any) => (
  <Suspense fallback={<ModalLoading />}>
    <NoteEditModal {...props} />
  </Suspense>
)

export const LazyNoteViewModal = (props: any) => (
  <Suspense fallback={<ModalLoading />}>
    <NoteViewModal {...props} />
  </Suspense>
)