// Utilitário client-side — use apenas em componentes marcados com 'use client'

const MAX_DIMENSION = 1200
const QUALITY = 0.8

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)

  let { width, height } = bitmap

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D não disponível.')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('Falha ao converter imagem para WebP.')),
      'image/webp',
      QUALITY
    )
  })
}

export function compressedFileName(originalName: string): string {
  const base = originalName.replace(/\.[^/.]+$/, '')
  return `${base}.webp`
}
