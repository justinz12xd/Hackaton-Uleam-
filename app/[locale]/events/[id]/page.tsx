"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, Clock, ArrowLeft, Check, Download } from "lucide-react"
import { Link, useRouter } from "@/lib/i18n/routing"
import { useParams } from "next/navigation"
import QRCode from "qrcode"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  image_url: string | null
  max_attendees: number | null
  status: string
  organizer_id: string
  resources_url: string | null
}

interface Registration {
  id: string
  qr_code: string
  registered_at: string
  attended_at: string | null
  is_attended: boolean
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [registrationCount, setRegistrationCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchEvent()
  }, [params.id])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchEvent = async () => {
    setIsLoading(true)

    // Fetch event details
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", params.id)
      .single()

    if (eventError || !eventData) {
      console.error("Error fetching event:", eventError)
      setIsLoading(false)
      return
    }

    setEvent(eventData)

    // Get registration count
    const { count } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", params.id)

    setRegistrationCount(count || 0)

    // Check if user is registered
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", params.id)
        .eq("user_id", user.id)
        .single()

      if (regData) {
        setRegistration(regData)
        generateQR(regData.qr_code)
      }
    }

    setIsLoading(false)
  }

  const generateQR = async (qrCode: string) => {
    try {
      const url = await QRCode.toDataURL(qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
      setQrDataUrl(url)
    } catch (err) {
      console.error("Error generating QR code:", err)
    }
  }

  const handleRegister = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!event) return

    setIsRegistering(true)

    // Generate unique QR code
    const qrCode = `EVENT-${event.id}-USER-${user.id}-${Date.now()}`

    const { data, error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: event.id,
        user_id: user.id,
        qr_code: qrCode,
      })
      .select()
      .single()

    if (error) {
      console.error("Error registering:", error)
      alert("Error registering for event")
      setIsRegistering(false)
      return
    }

    setRegistration(data)
    generateQR(qrCode)
    setRegistrationCount((prev) => prev + 1)
    setIsRegistering(false)

    // TODO: Send email with QR code
    alert("Registration successful! Check your email for the QR code.")
  }

  const downloadQR = () => {
    if (!qrDataUrl) return

    const link = document.createElement("a")
    link.download = `event-${event?.id}-qr.png`
    link.href = qrDataUrl
    link.click()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Event not found</p>
          <Link href="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isFull = event.max_attendees && registrationCount >= event.max_attendees
  const isPast = new Date(event.event_date) < new Date()

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/events" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className="w-24 h-24 text-primary/40" />
                </div>
              )}
            </div>

            {/* Event Info */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">{event.title}</h1>
              <p className="text-lg text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{formatDate(event.event_date)}</p>
                    <p className="text-sm text-muted-foreground">{formatTime(event.event_date)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Attendees</p>
                    <p className="text-sm text-muted-foreground">
                      {registrationCount} registered
                      {event.max_attendees && ` / ${event.max_attendees} max`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            {registration ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    You're Registered!
                  </CardTitle>
                  <CardDescription>
                    Save your QR code for check-in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {qrDataUrl && (
                    <div className="bg-white p-4 rounded-lg">
                      <img src={qrDataUrl} alt="QR Code" className="w-full" />
                    </div>
                  )}

                  <Button onClick={downloadQR} className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Download QR Code
                  </Button>

                  {registration.is_attended && registration.attended_at && (
                    <>
                      <Alert className="bg-green-500/10 border-green-500/20">
                        <Check className="w-4 h-4 text-green-500" />
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          Attendance marked on {new Date(registration.attended_at).toLocaleDateString()}
                        </AlertDescription>
                      </Alert>

                      {event.resources_url && (
                        <Link href={event.resources_url} target="_blank">
                          <Button className="w-full" variant="outline">
                            Access Resources
                          </Button>
                        </Link>
                      )}
                    </>
                  )}

                  {!registration.is_attended && (
                    <p className="text-sm text-muted-foreground text-center">
                      Show this QR code at check-in to access resources
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Register for Event</CardTitle>
                  <CardDescription>
                    Get your QR code for check-in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!user ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Please log in to register for this event
                      </p>
                      <Link href="/auth/login">
                        <Button className="w-full">Log In to Register</Button>
                      </Link>
                    </>
                  ) : isFull ? (
                    <Alert>
                      <AlertDescription>
                        This event is full. Registration is closed.
                      </AlertDescription>
                    </Alert>
                  ) : isPast ? (
                    <Alert>
                      <AlertDescription>
                        This event has already passed.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      disabled={isRegistering}
                      className="w-full"
                    >
                      {isRegistering ? "Registering..." : "Register Now"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status Badge */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Event Status</span>
                  <Badge variant={event.status === "upcoming" ? "default" : "secondary"}>
                    {event.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
