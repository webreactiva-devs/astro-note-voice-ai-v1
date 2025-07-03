import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Download } from 'lucide-react'

interface AudioPlayerProps {
  audioBlob: Blob | null
  className?: string
}

export function AudioPlayer({ audioBlob, className }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioBlob) {
      // Create URL for the audio blob
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

      // Cleanup function to revoke URL
      return () => {
        URL.revokeObjectURL(url)
        setAudioUrl(null)
      }
    }
  }, [audioBlob])

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

  if (!audioUrl) {
    return null
  }

  return (
    <div className={className}>
      <div className="space-y-3 sm:space-y-4">
        {/* Native HTML5 Audio Player */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            className="w-full h-10 sm:h-8"
            style={{
              filter: 'sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(12%)',
              maxWidth: '100%'
            }}
          >
            <source src={audioUrl} type="audio/webm" />
            <source src={audioUrl} type="audio/wav" />
            <source src={audioUrl} type="audio/mp3" />
            Tu navegador no soporta la reproducción de audio.
          </audio>
        </div>

        {/* Download Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="gap-2 h-10 touch-manipulation"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Descargar Audio</span>
            <span className="sm:hidden">Descargar</span>
          </Button>
        </div>
      </div>
    </div>
  )
}