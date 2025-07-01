import { useRef, useEffect, useCallback } from 'react'

export interface AudioVisualizerOptions {
  fftSize?: number
  smoothingTimeConstant?: number
  minDecibels?: number
  maxDecibels?: number
}

export function useAudioVisualizer(
  isRecording: boolean,
  options: AudioVisualizerOptions = {}
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const {
    fftSize = 256,
    smoothingTimeConstant = 0.8,
    minDecibels = -90,
    maxDecibels = -10,
  } = options

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up drawing style with fallback colors
    ctx.fillStyle = '#3b82f6' // Blue fallback
    ctx.strokeStyle = '#3b82f6' // Blue fallback
    
    const barWidth = canvas.width / dataArray.length
    let x = 0

    // Draw frequency bars
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 0.8
      
      // Create gradient effect
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)') // Blue with transparency
      gradient.addColorStop(1, 'rgba(59, 130, 246, 1)') // Blue solid
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
      
      x += barWidth
    }

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(drawWaveform)
    }
  }, [isRecording])

  const startVisualization = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      })
      streamRef.current = stream

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()

      analyser.fftSize = fftSize
      analyser.smoothingTimeConstant = smoothingTimeConstant
      analyser.minDecibels = minDecibels
      analyser.maxDecibels = maxDecibels

      source.connect(analyser)
      analyserRef.current = analyser

      // Start the animation loop
      drawWaveform()
    } catch (error) {
      console.error('Error starting audio visualization:', error)
    }
  }, [fftSize, smoothingTimeConstant, minDecibels, maxDecibels, drawWaveform])

  const stopVisualization = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    analyserRef.current = null

    // Clear canvas
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [])

  useEffect(() => {
    if (isRecording) {
      startVisualization()
    } else {
      stopVisualization()
    }

    return () => {
      stopVisualization()
    }
  }, [isRecording, startVisualization, stopVisualization])

  return { canvasRef }
}