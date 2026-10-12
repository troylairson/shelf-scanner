import { useRef, useState, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false)
      return
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      setStream(mediaStream)
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access denied'
      setError(msg)
    }
  }, [])

  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop())
    setStream(null)
  }, [stream])

  const capture = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current
    if (!video) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    return canvas
  }, [])

  // Attach stream to video element after it renders
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [stream])

  return { videoRef, stream, error, supported, start, stop, capture }
}
