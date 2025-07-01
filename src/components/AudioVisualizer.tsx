import { useAudioVisualizer } from '@/lib/hooks/useAudioVisualizer'
import { cn } from '@/lib/utils'

interface AudioVisualizerProps {
  isRecording: boolean
  className?: string
  width?: number
  height?: number
}

export function AudioVisualizer({ 
  isRecording, 
  className,
  width = 400,
  height = 100 
}: AudioVisualizerProps) {
  const { canvasRef } = useAudioVisualizer(isRecording)

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted/50", className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full"
      />
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">
            Press record to see audio waveform
          </div>
        </div>
      )}
    </div>
  )
}