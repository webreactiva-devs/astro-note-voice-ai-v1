import { useState, useRef, useCallback } from 'react'

export interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  audioBlob: Blob | null
  error: string | null
  timeRemaining: number
}

export interface AudioRecorderControls {
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => void
  resetRecording: () => void
}

const MAX_RECORDING_TIME = 120 // 2 minutes in seconds

export function useAudioRecorder(): AudioRecorderState & AudioRecorderControls {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    audioBlob: null,
    error: null,
    timeRemaining: MAX_RECORDING_TIME,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const updateTimeRemaining = useCallback(() => {
    setState(prev => {
      const newTimeRemaining = prev.timeRemaining - 1
      
      if (newTimeRemaining <= 0) {
        // Auto-stop when time runs out
        stopRecording()
        return { ...prev, timeRemaining: 0 }
      }
      
      return { ...prev, timeRemaining: newTimeRemaining }
    })
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(updateTimeRemaining, 1000)
  }, [updateTimeRemaining])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try different mime types for better compatibility
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4'
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '' // Let browser decide
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mimeType || 'audio/webm' 
        })
        console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type)
        setState(prev => ({ ...prev, audioBlob, isRecording: false }))
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false, 
        error: null 
      }))
      
      startTimer()
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start recording' 
      }))
    }
  }, [startTimer])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause()
      setState(prev => ({ ...prev, isPaused: true }))
      stopTimer()
    }
  }, [state.isRecording, state.isPaused, stopTimer])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume()
      setState(prev => ({ ...prev, isPaused: false }))
      startTimer()
    }
  }, [state.isRecording, state.isPaused, startTimer])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop()
      stopTimer()
    }
  }, [state.isRecording, stopTimer])

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    
    stopTimer()
    audioChunksRef.current = []
    
    setState({
      isRecording: false,
      isPaused: false,
      audioBlob: null,
      error: null,
      timeRemaining: MAX_RECORDING_TIME,
    })
  }, [stopTimer])

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  }
}