import imageCompression from 'browser-image-compression'

const MAX_SIZE_MB = 0.3
const MAX_WIDTH_PX = 1200

export async function compressImage(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_PX,
    useWebWorker: true,
    fileType: 'image/jpeg',
  })
}

export async function scanImage(imageBlob: Blob): Promise<string[]> {
  const formData = new FormData()
  formData.append('image', imageBlob, 'scan.jpg')

  const response = await fetch('/api/scan', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data) {
    throw new Error(data?.error ?? `Server error ${response.status}`)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return (data.titles ?? []) as string[]
}

export async function captureFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to capture canvas'))
      },
      'image/jpeg',
      0.9
    )
  })
}
