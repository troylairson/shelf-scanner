import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import { compressImage, scanImage, captureFromCanvas } from '../utils/imageProcessor'
import type { ScanResult } from '../types'

interface Props {
  onScanComplete: (result: ScanResult, detectedTitles: string[]) => void
}

export function CameraView({ onScanComplete }: Props) {
  const { videoRef, stream, error, start, stop, capture } = useCamera()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  useEffect(() => {
    return () => stop()
  }, [])

  async function processBlob(blob: Blob) {
    setScanning(true)
    setScanError(null)
    try {
      const titles = await scanImage(blob)
      onScanComplete(
        { detectedTitles: titles, matches: [], unmatched: titles, scannedAt: Date.now() },
        titles
      )
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function handleCapture() {
    const canvas = capture()
    if (!canvas) return
    const blob = await captureFromCanvas(canvas)
    const compressed = await compressImage(new File([blob], 'capture.jpg', { type: 'image/jpeg' }))
    await processBlob(compressed)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    await processBlob(compressed)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-ink">
            {error ? (
              <div className="px-8 text-center space-y-2">
                <p className="text-paper font-black text-lg">NO CAMERA</p>
                <p className="text-paper/50 text-sm">{error}</p>
                <p className="text-paper/30 text-xs">Use the upload button below</p>
              </div>
            ) : (
              <div className="items-center flex flex-col gap-6">
                <button
                  onClick={start}
                  className="w-24 h-24 rounded-full bg-paper btn-hard flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-ink">
                    <path strokeLinecap="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
                <p className="text-paper/40 text-xs font-black tracking-widest">TAP TO START CAMERA</p>
              </div>
            )}
          </div>
        )}

        {/* Scanning overlay */}
        {scanning && (
          <div className="absolute inset-0 bg-ink/80 flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-punch border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-paper font-black text-2xl tracking-tight">ANALYZING</p>
              <p className="text-paper/40 text-sm font-bold tracking-widest mt-1">READING TITLES</p>
            </div>
          </div>
        )}

        {/* Corner guides */}
        {stream && !scanning && (
          <div className="absolute inset-8 pointer-events-none">
            {[
              'top-0 left-0 border-t-2 border-l-2',
              'top-0 right-0 border-t-2 border-r-2',
              'bottom-0 left-0 border-b-2 border-l-2',
              'bottom-0 right-0 border-b-2 border-r-2',
            ].map((cls) => (
              <div key={cls} className={`absolute w-6 h-6 border-paper/70 ${cls}`} />
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {scanError && (
        <div className="border-t-2 border-ink bg-red-500 px-4 py-3 flex items-center gap-3">
          <p className="text-white font-bold text-sm flex-1">{scanError}</p>
          <button onClick={() => setScanError(null)} className="text-white font-black text-xl leading-none">×</button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-ink border-t-2 border-paper/10 px-8 py-6 flex items-center justify-between">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="w-12 h-12 rounded-full bg-paper/10 border-2 border-paper/20 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          aria-label="Upload photo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-paper">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </button>

        <button
          onClick={handleCapture}
          disabled={!stream || scanning}
          className="w-20 h-20 rounded-full bg-paper disabled:opacity-40 border-2 border-paper shadow-[0_0_0_4px_rgba(255,255,255,0.15)] active:scale-95 transition-transform"
          aria-label="Capture"
        />

        <div className="w-12" />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
