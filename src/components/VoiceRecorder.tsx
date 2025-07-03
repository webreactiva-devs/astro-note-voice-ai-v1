import { useState, useRef, useEffect } from 'react'
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder'
import { useToast } from '@/lib/hooks/useToast'
import { AudioVisualizer } from './AudioVisualizer'
import { RecordingControls } from './RecordingControls'
import { RecordingTimer } from './RecordingTimer'
import { LazyTranscriptionModal } from './LazyModal'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { cn } from '@/lib/utils'
import { Download, Play, Pause, Send } from 'lucide-react'

interface VoiceRecorderProps {
  className?: string
}

export function VoiceRecorder({ className }: VoiceRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
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

  useEffect(() => {
    if (audioBlob) {
      // Clean up previous audio if exists
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
        audioRef.current = null
      }
      
      const audio = new Audio()
      audioRef.current = audio
      
      // Reset states
      setPlaybackTime(0)
      setDuration(0)
      setIsPlaying(false)
      
      const updateDuration = () => {
        if (isFinite(audio.duration) && audio.duration > 0) {
          console.log('Duration updated:', audio.duration)
          setDuration(audio.duration)
        }
      }
      
      const handleLoadedMetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration)
        updateDuration()
      }
      
      const handleLoadedData = () => {
        console.log('Audio data loaded, duration:', audio.duration)
        updateDuration()
      }
      
      const handleCanPlay = () => {
        console.log('Audio can play, duration:', audio.duration)
        updateDuration()
      }
      
      const handleDurationChange = () => {
        console.log('Duration changed:', audio.duration)
        updateDuration()
      }
      
      const handleTimeUpdate = () => {
        if (isFinite(audio.currentTime)) {
          setPlaybackTime(audio.currentTime)
        }
      }
      
      const handleEnded = () => {
        setIsPlaying(false)
        setPlaybackTime(0)
        audio.currentTime = 0
      }
      
      const handleError = (e: Event) => {
        console.error('Audio error:', e)
        setIsPlaying(false)
      }
      
      // Add all event listeners before setting source
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('loadeddata', handleLoadedData)
      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('durationchange', handleDurationChange)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)
      
      // Set source and load
      audio.src = URL.createObjectURL(audioBlob)
      audio.load()
      
      // Backup: try to get duration after a small delay for WebM files
      const timeoutId = setTimeout(() => {
        if (!isFinite(audio.duration) || audio.duration === 0) {
          console.log('Attempting to reload audio for duration...')
          audio.load()
          
          // Try one more time after another delay
          setTimeout(() => {
            updateDuration()
          }, 500)
        }
      }, 100)
      
      return () => {
        clearTimeout(timeoutId)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('loadeddata', handleLoadedData)
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('durationchange', handleDurationChange)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
        audioRef.current = null
      }
      setPlaybackTime(0)
      setDuration(0)
      setIsPlaying(false)
    }
  }, [audioBlob])

  const handlePlayPause = async () => {
    if (!audioRef.current) return
    
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
    }
  }

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) {
      return '0:00'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    if (!audioBlob) return
    
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voice-note-${new Date().toISOString().slice(0, 19)}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
          content: editedTranscription
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
    <Card className={cn("p-6 space-y-6", className)}>
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="text-center space-y-4">
        <RecordingTimer
          timeRemaining={timeRemaining}
          isRecording={isRecording}
        />
        
        <AudioVisualizer
          isRecording={isRecording && !isPaused}
          className="mx-auto max-w-md"
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
        className="justify-center"
      />

      {audioBlob && !isRecording && (
        <div className="space-y-4">
          {/* Audio playback timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime(playbackTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : 'Loading...'}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${duration > 0 ? (playbackTime / duration) * 100 : 0}%` }}
              />
            </div>
            {duration === 0 && (
              <div className="text-xs text-center text-muted-foreground">
                Processing audio...
              </div>
            )}
          </div>

          <div className="flex justify-center gap-2">
            <Button
              onClick={handlePlayPause}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Play
                </>
              )}
            </Button>

            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleTranscribe}
              size="lg"
              className="gap-2"
              disabled={isTranscribing}
            >
              <Send className="h-4 w-4" />
              {isTranscribing ? 'Transcribing...' : 'Send to Transcribe'}
            </Button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="text-center text-sm text-muted-foreground">
          {isPaused ? 'Recording paused' : 'Recording in progress...'}
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