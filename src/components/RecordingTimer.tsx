import { cn } from '@/lib/utils'

interface RecordingTimerProps {
  timeRemaining: number
  isRecording: boolean
  className?: string
}

export function RecordingTimer({ 
  timeRemaining, 
  isRecording, 
  className 
}: RecordingTimerProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = (): number => {
    const maxTime = 120 // 2 minutes
    return ((maxTime - timeRemaining) / maxTime) * 100
  }

  const isWarning = timeRemaining <= 30
  const isCritical = timeRemaining <= 10

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div 
        className={cn(
          "text-3xl font-mono font-bold transition-colors",
          isRecording && isCritical && "text-destructive animate-pulse",
          isRecording && isWarning && !isCritical && "text-yellow-500",
          !isRecording && "text-muted-foreground"
        )}
      >
        {formatTime(timeRemaining)}
      </div>
      
      {isRecording && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-linear",
                isCritical && "bg-destructive",
                isWarning && !isCritical && "bg-yellow-500",
                !isWarning && "bg-primary"
              )}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>00:00</span>
            <span>02:00</span>
          </div>
        </div>
      )}
      
      {!isRecording && timeRemaining < 120 && (
        <div className="text-sm text-muted-foreground">
          Recording stopped
        </div>
      )}
    </div>
  )
}

export default RecordingTimer