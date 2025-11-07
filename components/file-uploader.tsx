"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Upload, X, File, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize, getFileIcon } from '@/lib/storage'

interface FileUploaderProps {
  courseId: string
  fileType: 'document' | 'image'
  onUploadComplete: (url: string, filePath: string, fileName: string) => void
  accept?: string
  maxSizeMB?: number
  className?: string
}

export function FileUploader({
  courseId,
  fileType,
  onUploadComplete,
  accept,
  maxSizeMB = 10,
  className = '',
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`)
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simular progreso mientras se sube
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', fileType)

      const response = await fetch(`/api/courses/${courseId}/upload`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir el archivo')
      }

      const data = await response.json()

      setUploadProgress(100)
      toast.success('Archivo subido exitosamente')

      // Llamar callback con la información del archivo
      onUploadComplete(data.url, data.path, data.fileName)

      // Resetear estado
      setTimeout(() => {
        setSelectedFile(null)
        setUploadProgress(0)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }, 1000)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al subir el archivo')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {!selectedFile ? (
        <div>
          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tamaño máximo: {maxSizeMB}MB
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4 space-y-3">
          {/* Archivo seleccionado */}
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getFileIcon(selectedFile.name)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Barra de progreso */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Subiendo... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Mensaje de éxito */}
          {uploadProgress === 100 && !isUploading && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Archivo subido exitosamente!</span>
            </div>
          )}

          {/* Botones */}
          {!isUploading && uploadProgress !== 100 && (
            <div className="flex gap-2">
              <Button onClick={handleUpload} className="flex-1" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Subir Archivo
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
