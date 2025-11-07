"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, Clock, ArrowLeft, Check, Download, Camera, X } from "lucide-react"
import { Link, useRouter } from "@/lib/i18n/routing"
import { useParams } from "next/navigation"
import QRCode from "qrcode"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Html5Qrcode } from "html5-qrcode"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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
  is_collaborator: boolean
}

interface Collaborator {
  id: string
  user_id: string
  profiles: {
    full_name: string
    email: string
  }
}

interface OrganizerProfile {
  full_name: string
  email: string
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
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string>("")
  const [scanSuccess, setScanSuccess] = useState<string>("")
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null)
  const [isCollaborator, setIsCollaborator] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [attendees, setAttendees] = useState<any[]>([])
  const [showAttendeesList, setShowAttendeesList] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchEvent()
  }, [params.id])

  // Realtime subscription for registration updates
  useEffect(() => {
    if (!event || !user) return

    const channel = supabase
      .channel(`event-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'event_registrations',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          console.log('Registration updated:', payload)
          
          // If it's the current user's registration, update state
          if (payload.new.user_id === user.id) {
            setRegistration(payload.new as Registration)
            console.log('Current user registration updated in realtime')
          }
          
          // Refresh attendees list if organizer
          if (isOrganizer) {
            fetchAttendees()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [event, user, isOrganizer])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    // Check if user is organizer
    if (user && event) {
      setIsOrganizer(user.id === event.organizer_id)
    }
  }

  useEffect(() => {
    if (user && event) {
      setIsOrganizer(user.id === event.organizer_id)
    }
  }, [user, event])

  // Fetch attendees when user is organizer
  useEffect(() => {
    if (isOrganizer && event) {
      fetchAttendees()
    }
  }, [isOrganizer, event])

  // Start scanner when dialog opens
  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      // Wait for DOM to be ready
      const timer = setTimeout(() => {
        initializeScanner()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isScanning])

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

    // Fetch organizer profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", eventData.organizer_id)
      .single()

    if (profileData) {
      setOrganizerProfile(profileData)
    }

    // Get registration count
    const { count } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", params.id)

    setRegistrationCount(count || 0)

    // Fetch collaborators
    const { data: collabData } = await supabase
      .from("event_registrations")
      .select("id, user_id, profiles:user_id(full_name, email)")
      .eq("event_id", params.id)
      .eq("is_collaborator", true)

    if (collabData) {
      setCollaborators(collabData as any)
    }

    // Check if user is registered
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: regData, error: regError } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", params.id)
        .eq("user_id", user.id)
        .maybeSingle() // Use maybeSingle() instead of single() to avoid error when no record found

      if (regData) {
        console.log("User registration data:", regData)
        setRegistration(regData)
        generateQR(regData.qr_code)
      } else if (regError) {
        console.error("Error fetching registration:", regError)
      }
      // If regData is null and no error, user is simply not registered (which is fine)
    }

    setIsLoading(false)
  }

  const fetchAttendees = async () => {
    if (!event) return

    try {
      // Get all registrations for this event
      const { data: registrations, error: regError } = await supabase
        .from("event_registrations")
        .select("id, user_id, is_attended, attended_at, is_collaborator, registered_at")
        .eq("event_id", event.id)
        .order("registered_at", { ascending: true })

      if (regError) {
        console.error("Error fetching registrations:", regError)
        return
      }

      if (!registrations || registrations.length === 0) {
        setAttendees([])
        return
      }

      // Get user profiles for all registrations
      const userIds = registrations.map(r => r.user_id)
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)

      if (profileError) {
        console.error("Error fetching profiles:", profileError)
      }

      // Merge registrations with profiles
      const attendeesWithProfiles = registrations.map(reg => ({
        ...reg,
        profiles: profiles?.find(p => p.id === reg.user_id) || null
      }))

      setAttendees(attendeesWithProfiles)
    } catch (error) {
      console.error("Error in fetchAttendees:", error)
    }
  }

  const toggleAttendance = async (registrationId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    
    const { error } = await supabase
      .from("event_registrations")
      .update({
        is_attended: newStatus,
        attended_at: newStatus ? new Date().toISOString() : null,
      })
      .eq("id", registrationId)

    if (error) {
      console.error("Error updating attendance:", error)
      alert("Error al actualizar asistencia")
      return
    }

    // Refresh attendees list
    fetchAttendees()
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
        is_collaborator: isCollaborator,
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

  const openScanner = () => {
    setIsScanning(true)
    setScanError("")
    setScanSuccess("")
  }

  const initializeScanner = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        (errorMessage) => {
          // Error callback - puede ignorarse ya que es normal que haya errores mientras escanea
        }
      )
    } catch (err) {
      console.error("Error starting scanner:", err)
      setScanError("No se pudo iniciar la cámara. Verifica los permisos.")
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
    }
    setIsScanning(false)
  }

  const onScanSuccess = async (decodedText: string) => {
    console.log("QR Code scanned:", decodedText)
    
    // Stop scanner immediately
    await stopScanner()

    // Parse QR code format: EVENT-{eventId}-USER-{userId}-{timestamp}
    const qrParts = decodedText.split("-")
    
    if (qrParts.length < 4 || qrParts[0] !== "EVENT") {
      setScanError("Código QR inválido")
      return
    }

    const scannedEventId = qrParts[1]
    
    // Verify QR is for this event
    if (scannedEventId !== event?.id) {
      setScanError("Este QR no corresponde a este evento")
      return
    }

    // Find registration by QR code
    const { data: regData, error: regError } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("qr_code", decodedText)
      .eq("event_id", event.id)
      .single()

    if (regError || !regData) {
      setScanError("Registro no encontrado")
      return
    }

    // Check if already attended
    if (regData.is_attended) {
      setScanError("Este usuario ya marcó asistencia")
      return
    }

    // Mark attendance
    const { error: updateError } = await supabase
      .from("event_registrations")
      .update({
        is_attended: true,
        attended_at: new Date().toISOString(),
      })
      .eq("id", regData.id)

    if (updateError) {
      console.error("Error updating attendance:", updateError)
      setScanError("Error al marcar asistencia")
      return
    }

    console.log("Attendance marked successfully for user:", regData.user_id)
    setScanSuccess("¡Asistencia registrada exitosamente!")
    
    // Refresh event data to update counts and collaborators
    await fetchEvent()
    
    // If the user being scanned is viewing this page, update their registration state
    if (user?.id === regData.user_id) {
      console.log("Updating current user's registration state")
      setRegistration({
        ...regData,
        is_attended: true,
        attended_at: new Date().toISOString(),
      })
    }
  }

  const onScanError = (errorMessage: string) => {
    // Ignore continuous scan errors
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
      {/* Scanner Dialog */}
      <Dialog open={isScanning} onOpenChange={(open) => !open && stopScanner()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Escanear Código QR
              <Button
                variant="ghost"
                size="icon"
                onClick={stopScanner}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
            
            {scanError && (
              <Alert variant="destructive">
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            )}
            
            {scanSuccess && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <Check className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {scanSuccess}
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-sm text-muted-foreground text-center">
              Coloca el código QR frente a la cámara
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
              
              {/* Organizer Info */}
              {organizerProfile && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-sm">
                    Organizado por: {organizerProfile.full_name || organizerProfile.email}
                  </Badge>
                  {isOrganizer && (
                    <Badge variant="default" className="text-sm">
                      Tú eres el organizador
                    </Badge>
                  )}
                </div>
              )}
              
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

            {/* Collaborators Section */}
            {collaborators.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Colaboradores del Evento</CardTitle>
                  <CardDescription>
                    Personas que ayudarán en la organización
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {collaborators.map((collab) => (
                      <div 
                        key={collab.id} 
                        className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50"
                      >
                        <Badge variant="secondary" className="text-xs">
                          Colaborador
                        </Badge>
                        <span className="text-sm">
                          {collab.profiles?.full_name || collab.profiles?.email || "Usuario"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resources Section - Only for registered users */}
            {!isOrganizer && registration && (
              <Card>
                <CardHeader>
                  <CardTitle>Recursos del Evento</CardTitle>
                  <CardDescription>
                    Accede a los recursos una vez marcada tu asistencia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {registration.is_attended && registration.attended_at ? (
                    <>
                      <Alert className="bg-green-500/10 border-green-500/20">
                        <Check className="w-4 h-4 text-green-500" />
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          ✓ Asistencia marcada el {new Date(registration.attended_at).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </AlertDescription>
                      </Alert>
                      
                      {event.resources_url ? (
                        <Link href={event.resources_url} target="_blank">
                          <Button className="w-full gap-2" size="lg">
                            <Download className="w-4 h-4" />
                            Acceder a Recursos del Evento
                          </Button>
                        </Link>
                      ) : (
                        <Alert>
                          <AlertDescription>
                            No hay recursos disponibles para este evento.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <>
                      <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/20">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                          ⏳ Pendiente de check-in. Muestra tu código QR en el evento para acceder a los recursos.
                        </AlertDescription>
                      </Alert>
                      
                      <Button 
                        onClick={fetchEvent} 
                        variant="outline" 
                        className="w-full"
                      >
                        🔄 Actualizar Estado
                      </Button>
                      
                      {event.resources_url && (
                        <Button className="w-full" size="lg" disabled variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Recursos disponibles después del check-in
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer Scanner */}
            {isOrganizer && (
              <>
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Escanear QR (Organizador)
                    </CardTitle>
                    <CardDescription>
                      Escanea los códigos QR de los asistentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={openScanner}
                      className="w-full gap-2"
                      variant="default"
                    >
                      <Camera className="w-4 h-4" />
                      Activar Cámara
                    </Button>
                  </CardContent>
                </Card>

                {/* Attendees List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Lista de Asistentes
                      </span>
                      <Badge variant="secondary">{attendees.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Gestiona la asistencia de forma manual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {attendees.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay registros aún
                        </p>
                      ) : (
                        attendees.map((attendee) => (
                          <div
                            key={attendee.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attendee.profiles?.full_name || attendee.profiles?.email || "Usuario"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {attendee.is_collaborator && (
                                  <Badge variant="secondary" className="text-xs">
                                    Colaborador
                                  </Badge>
                                )}
                                {attendee.is_attended ? (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    ✓ Asistió
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Pendiente
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={attendee.is_attended ? "outline" : "default"}
                              onClick={() => toggleAttendance(attendee.id, attendee.is_attended)}
                              className="ml-2"
                            >
                              {attendee.is_attended ? "Desmarcar" : "Marcar"}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Registration Card */}
            {!isOrganizer && (
              registration ? (
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

                    <p className="text-sm text-muted-foreground text-center">
                      Muestra este código QR en el evento para marcar asistencia
                    </p>
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
                      <>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox 
                            id="collaborator" 
                            checked={isCollaborator}
                            onCheckedChange={(checked) => setIsCollaborator(checked as boolean)}
                          />
                          <Label 
                            htmlFor="collaborator"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Registrarme como colaborador del evento
                          </Label>
                        </div>
                        <Button
                          onClick={handleRegister}
                          disabled={isRegistering}
                          className="w-full"
                        >
                          {isRegistering ? "Registering..." : "Register Now"}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
