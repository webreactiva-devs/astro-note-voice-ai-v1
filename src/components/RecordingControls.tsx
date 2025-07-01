import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  RotateCcw 
} from 'lucide-react'

interface RecordingControlsProps {
  isRecording: boolean
  isPaused: boolean
  hasAudio: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  disabled?: boolean
  className?: string
}

export function RecordingControls({
  isRecording,
  isPaused,
  hasAudio,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  disabled = false,
  className
}: RecordingControlsProps) {
  const getPrimaryButton = () => {
    if (!isRecording && !hasAudio) {
      return (
        <Button
          onClick={onStart}
          disabled={disabled}
          size="lg"
          className="h-16 w-16 rounded-full"
        >
          <Mic className="h-6 w-6" />
        </Button>
      )
    }

    if (isRecording && !isPaused) {
      return (
        <Button
          onClick={onPause}
          disabled={disabled}
          size="lg"
          variant="secondary"
          className="h-16 w-16 rounded-full"
        >
          <Pause className="h-6 w-6" />
        </Button>
      )
    }

    if (isRecording && isPaused) {
      return (
        <Button
          onClick={onResume}
          disabled={disabled}
          size="lg"
          className="h-16 w-16 rounded-full"
        >
          <Play className="h-6 w-6" />
        </Button>
      )
    }

    return null
  }

  const getSecondaryButtons = () => {
    const buttons = []

    if (isRecording) {
      buttons.push(
        <Button
          key="stop"
          onClick={onStop}
          disabled={disabled}
          variant="outline"
          size="lg"
          className="h-12 w-12 rounded-full"
        >
          <Square className="h-4 w-4" />
        </Button>
      )
    }

    if (hasAudio || isRecording) {
      buttons.push(
        <Button
          key="reset"
          onClick={onReset}
          disabled={disabled}
          variant="outline"
          size="lg"
          className="h-12 w-12 rounded-full"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )
    }

    return buttons
  }

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {getPrimaryButton()}
      <div className="flex gap-2">
        {getSecondaryButtons()}
      </div>
    </div>
  )
}