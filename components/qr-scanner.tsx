"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void
  onClose: () => void
}

export function QrScanner({ onScanSuccess, onClose }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameras, setCameras] = useState<any[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices)
          // Prefer back camera on mobile
          const backCamera = devices.find((device) =>
            device.label.toLowerCase().includes("back")
          )
          setSelectedCamera(backCamera?.id || devices[0].id)
        } else {
          setError("No cameras found on this device")
        }
      })
      .catch((err) => {
        console.error("Error getting cameras:", err)
        setError("Could not access camera. Please grant camera permissions.")
      })

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    if (!selectedCamera) {
      setError("No camera selected")
      return
    }

    try {
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScanSuccess(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Ignore errors from scanning process (happens when no QR in view)
        }
      )

      setIsScanning(true)
      setError(null)
    } catch (err: any) {
      console.error("Error starting scanner:", err)
      setError(err.message || "Failed to start camera")
      setIsScanning(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
      setIsScanning(false)
    }
  }

  const handleClose = async () => {
    await stopScanning()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Escanear Código QR
          </h3>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {cameras.length > 1 && !isScanning && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar cámara:</label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden bg-black"
            style={{ minHeight: isScanning ? "300px" : "0px" }}
          />

          {!isScanning && !error && (
            <Button onClick={startScanning} className="w-full" size="lg">
              <Camera className="w-4 h-4 mr-2" />
              Iniciar Escaneo
            </Button>
          )}

          {isScanning && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Apunta la cámara hacia el código QR
              </p>
              <Button onClick={stopScanning} variant="outline" className="w-full">
                Detener Escaneo
              </Button>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              El escaneo funciona tanto en laptop como en móvil.
              <br />
              Asegúrate de permitir el acceso a la cámara.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
