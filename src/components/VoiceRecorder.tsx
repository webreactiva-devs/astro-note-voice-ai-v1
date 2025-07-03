import { useState } from 'react'
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder'
import { useToast } from '@/lib/hooks/useToast'
import { AudioVisualizer } from './AudioVisualizer'
import { RecordingControls } from './RecordingControls'
import { RecordingTimer } from './RecordingTimer'
import { AudioPlayer } from './AudioPlayer'
import { LazyTranscriptionModal } from './LazyModal'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'

interface VoiceRecorderProps {
  className?: string
}

export function VoiceRecorder({ className }: VoiceRecorderProps) {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false)
  const toast = useToast()
  
  const {
    isRecording,
    isPaused,
    audioBlob,
    error,
    timeRemaining,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder()


  const handleTranscribe = async () => {
    console.log('handleTranscribe called')
    console.log('audioBlob:', audioBlob)
    
    if (!audioBlob) {
      console.log('No audio blob available')
      return
    }

    setIsTranscribing(true)
    
    try {
      console.log('Starting transcription...')
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      console.log('Making request to /api/transcribe...')
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Transcription result:', result)
        setTranscription(result.transcription)
        setShowTranscriptionModal(true)
      } else {
        const error = await response.json()
        console.error('API error:', error)
        await toast.error(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error transcribing:', error)
      await toast.error('Error al transcribir el audio')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleSaveTranscription = async (editedTranscription: string) => {
    try {
      console.log('Saving transcription as note:', editedTranscription)
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedTranscription,
          isTranscription: true
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Note saved:', result)
        await toast.success('¡Nota guardada exitosamente!')
      } else {
        const error = await response.json()
        console.error('Error saving note:', error)
        await toast.error(`Error al guardar: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving transcription:', error)
      await toast.error('Error al guardar la transcripción')
    }
  }

  return (
    <Card className={cn("p-4 sm:p-6 space-y-4 sm:space-y-6", className)}>
      {error && (
        <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-xs sm:text-sm">{error}</p>
        </div>
      )}

      <div className="text-center space-y-3 sm:space-y-4">
        <RecordingTimer
          timeRemaining={timeRemaining}
          isRecording={isRecording}
        />
        
        <AudioVisualizer
          isRecording={isRecording && !isPaused}
          className="mx-auto max-w-xs sm:max-w-md"
        />
      </div>

      <RecordingControls
        isRecording={isRecording}
        isPaused={isPaused}
        hasAudio={!!audioBlob}
        onStart={startRecording}
        onPause={pauseRecording}
        onResume={resumeRecording}
        onStop={stopRecording}
        onReset={resetRecording}
        className="justify-center flex-wrap gap-2 sm:gap-3"
      />

      {audioBlob && !isRecording && (
        <div className="space-y-4 sm:space-y-6">
          {/* Audio Player */}
          <AudioPlayer 
            audioBlob={audioBlob}
            className="w-full"
          />

          {/* Transcribe Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleTranscribe}
              size="lg"
              className="gap-2 w-full sm:w-auto min-h-[44px]"
              disabled={isTranscribing}
            >
              <Send className="h-4 w-4" />
              {isTranscribing ? 'Transcribiendo...' : 'Transcribir Audio'}
            </Button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="text-center text-xs sm:text-sm text-muted-foreground">
          {isPaused ? 'Grabación pausada' : 'Grabando...'}
        </div>
      )}

      {showTranscriptionModal && (
        <LazyTranscriptionModal
          isOpen={showTranscriptionModal}
          onClose={() => setShowTranscriptionModal(false)}
          transcription={transcription}
          onSave={handleSaveTranscription}
        />
      )}

    </Card>
  )
}