"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { QrCode, Scan, RefreshCw, XCircle, AlertTriangle } from "lucide-react"

declare global {
  interface Window {
    Html5QrcodeScanner: any;
  }
}

interface QRScannerProps {
  module: "blasting" | "drilling" | "diamond" | "fleet"
  onScan: (data: string) => void
}

export function QRScanner({ module, onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  const scannerId = "qr-reader"

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e: any) => console.error(e))
      }
    }
  }, [])

  const loadScannerScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Html5QrcodeScanner) {
        resolve()
        return
      }
      const script = document.createElement("script")
      script.src = "https://unpkg.com/html5-qrcode"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load scanner engine"))
      document.body.appendChild(script)
    })
  }

  const startScan = async () => {
    try {
      setError(null)
      setIsScanning(true)
      await loadScannerScript()
      
      const config = { fps: 10, qrbox: { width: 200, height: 200 } }
      scannerRef.current = new window.Html5QrcodeScanner(scannerId, config, false)
      
      scannerRef.current.render(
        (decodedText: string) => {
          onScan(decodedText)
          stopScan()
        },
        (error: any) => {
          // Normal scanning errors (no code found) are ignored
        }
      )
    } catch (err: any) {
      setError("Camera Access Required (Ruhusa ya Kamera Inahitajika)")
      setIsScanning(false)
    }
  }

  const stopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        setIsScanning(false)
        scannerRef.current = null
      }).catch((e: any) => {
        console.error(e)
        setIsScanning(false)
      })
    } else {
        setIsScanning(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode)
      setManualCode("")
    }
  }

  return (
    <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6">
          
          {isScanning ? (
              <div className="w-full relative">
                  <div id={scannerId} className="w-full rounded-2xl overflow-hidden border-4 border-white shadow-2xl" />
                  <Button 
                    onClick={stopScan} 
                    variant="destructive" 
                    className="absolute -top-3 -right-3 h-10 w-10 rounded-full p-0 shadow-lg z-20"
                  >
                      <XCircle className="w-6 h-6" />
                  </Button>
              </div>
          ) : (
            <div className="relative w-full aspect-square max-w-[240px] bg-slate-100 rounded-3xl border-4 border-white shadow-inner flex flex-col items-center justify-center overflow-hidden group">
                {error ? (
                    <div className="p-4 text-center">
                        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase text-red-600 leading-tight">{error}</p>
                    </div>
                ) : (
                    <>
                        <QrCode className="w-24 h-24 text-slate-300 group-hover:text-primary/40 transition-colors" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-4">Optical Ready</p>
                    </>
                )}
                <div className="absolute inset-0 border-[40px] border-slate-100/40 pointer-events-none" />
            </div>
          )}

          <div className="w-full space-y-4">
            {!isScanning && (
                <Button 
                    onClick={startScan} 
                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest shadow-xl transition-all"
                >
                    <Scan className="w-5 h-5 mr-3" /> Initiate Optical Scan
                </Button>
            )}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 px-4 text-muted-foreground font-black tracking-widest">Manual Registry</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Product SKU / Batch Code"
                className="h-12 border-2 rounded-xl bg-white"
              />
              <Button type="submit" variant="outline" className="h-12 w-12 rounded-xl border-2">
                <Scan className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
