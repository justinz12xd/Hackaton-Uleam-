"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import { Link } from "@/lib/i18n/routing"

export default function CheckInPage() {
  const [qrCode, setQrCode] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    userName?: string
    eventTitle?: string
  } | null>(null)

  const supabase = createClient()

  const handleCheckIn = async () => {
    if (!qrCode.trim()) {
      setResult({
        success: false,
        message: "Please enter a QR code",
      })
      return
    }

    setIsChecking(true)
    setResult(null)

    try {
      // Find registration by QR code
      const { data: registrationData, error: regError } = await supabase
        .from("event_registrations")
        .select(`
          id,
          user_id,
          event_id,
          is_attended,
          attended_at,
          events (
            title
          ),
          profiles!event_registrations_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq("qr_code", qrCode.trim())
        .single()

      if (regError || !registrationData) {
        setResult({
          success: false,
          message: "Invalid QR code. Registration not found.",
        })
        setIsChecking(false)
        return
      }

      const registration = registrationData as any

      // Check if already checked in
      if (registration.is_attended) {
        setResult({
          success: false,
          message: `Already checked in on ${new Date(registration.attended_at!).toLocaleString()}`,
          userName: registration.profiles?.full_name || registration.profiles?.email || "Unknown",
          eventTitle: registration.events?.title || "Unknown Event",
        })
        setIsChecking(false)
        return
      }

      // Mark as attended
      const { error: updateError } = await supabase
        .from("event_registrations")
        .update({
          is_attended: true,
          attended_at: new Date().toISOString(),
        })
        .eq("id", registration.id)

      if (updateError) {
        setResult({
          success: false,
          message: "Error marking attendance. Please try again.",
        })
        setIsChecking(false)
        return
      }

      setResult({
        success: true,
        message: "Check-in successful!",
        userName: registration.profiles?.full_name || registration.profiles?.email || "Unknown",
        eventTitle: registration.events?.title || "Unknown Event",
      })

      setQrCode("")
    } catch (error) {
      console.error("Error checking in:", error)
      setResult({
        success: false,
        message: "An error occurred. Please try again.",
      })
    }

    setIsChecking(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCheckIn()
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/events" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <Card className="mt-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Event Check-In</CardTitle>
            <CardDescription className="text-base">
              Scan or enter the QR code to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">QR Code</label>
              <Input
                placeholder="Enter QR code or scan..."
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Paste the QR code value or use a scanner
              </p>
            </div>

            <Button
              onClick={handleCheckIn}
              disabled={isChecking || !qrCode.trim()}
              className="w-full"
              size="lg"
            >
              {isChecking ? "Checking in..." : "Check In"}
            </Button>

            {result && (
              <Alert className={result.success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className={result.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                      <p className="font-semibold">{result.message}</p>
                      {result.userName && (
                        <p className="mt-2 text-sm">
                          <span className="font-medium">Attendee:</span> {result.userName}
                        </p>
                      )}
                      {result.eventTitle && (
                        <p className="text-sm">
                          <span className="font-medium">Event:</span> {result.eventTitle}
                        </p>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            <div className="pt-6 border-t">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Ask the attendee to show their QR code</li>
                <li>Scan or manually enter the QR code value</li>
                <li>Click "Check In" to mark attendance</li>
                <li>Attendee will get access to event resources</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">Fast Check-In</p>
              <p className="text-sm text-muted-foreground">Instant attendance marking</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <QrCode className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">QR Verification</p>
              <p className="text-sm text-muted-foreground">Secure and reliable</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
