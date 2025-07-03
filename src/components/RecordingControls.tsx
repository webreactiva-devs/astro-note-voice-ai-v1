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
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full touch-manipulation"
        >
          <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
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
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full touch-manipulation"
        >
          <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )
    }

    if (isRecording && isPaused) {
      return (
        <Button
          onClick={onResume}
          disabled={disabled}
          size="lg"
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full touch-manipulation"
        >
          <Play className="h-5 w-5 sm:h-6 sm:w-6" />
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
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full touch-manipulation"
        >
          <Square className="h-3 w-3 sm:h-4 sm:w-4" />
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
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full touch-manipulation"
        >
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      )
    }

    return buttons
  }

  return (
    <div className={cn("flex items-center justify-center gap-3 sm:gap-4", className)}>
      {getPrimaryButton()}
      <div className="flex gap-2 sm:gap-3">
        {getSecondaryButtons()}
      </div>
    </div>
  )
}