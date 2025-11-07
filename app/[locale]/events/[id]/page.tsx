"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, Clock, ArrowLeft, Check, Download, Camera, X, Upload, FileText, Image as ImageIcon, ChevronDown } from "lucide-react"
import { Link, useRouter } from "@/lib/i18n/routing"
import { useParams } from "next/navigation"
import QRCode from "qrcode"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Html5Qrcode } from "html5-qrcode"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [isUploadingResource, setIsUploadingResource] = useState(false)
  const [resourceTitle, setResourceTitle] = useState("")
  const [resourceDescription, setResourceDescription] = useState("")
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [resourceType, setResourceType] = useState<string>("document")
  const [eventResources, setEventResources] = useState<any[]>([])
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
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
      fetchEventResources()
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

    console.log("📊 Event loaded:", eventData)
    console.log("📎 Resources URL:", eventData.resources_url)

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
      .select("id, user_id, is_collaborator")
      .eq("event_id", params.id)
      .eq("is_collaborator", true)

    if (collabData && collabData.length > 0) {
      // Get profiles for collaborators
      const userIds = collabData.map((c: any) => c.user_id)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
      
      // Merge collaborators with profiles
      const mergedCollabs = collabData.map((collab: any) => ({
        ...collab,
        profiles: profilesData?.find((p: any) => p.id === collab.user_id)
      }))
      
      setCollaborators(mergedCollabs as any)
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

  const fetchEventResources = async () => {
    if (!event) return

    const { data, error } = await supabase
      .from('event_resources')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching resources:", error)
      return
    }

    console.log("📦 Recursos cargados:", data)
    setEventResources(data || [])
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
    console.log("=== QR SCAN STARTED ===")
    console.log("QR Code scanned:", decodedText)
    
    // Stop scanner immediately
    await stopScanner()

    console.log("✅ QR validation passed, searching registration by QR code...")

    // Find registration by exact QR code match (more reliable)
    const { data: regData, error: regError } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("qr_code", decodedText)
      .eq("event_id", event?.id)
      .maybeSingle()

    console.log("Registration data:", regData)
    console.log("Registration error:", regError)

    if (regError) {
      console.error("❌ Error fetching registration:", regError)
      setScanError("Error al buscar registro: " + regError.message)
      return
    }

    if (!regData) {
      console.log("❌ Registration not found for this QR and event")
      setScanError("Registro no encontrado para este evento. Verifica que el QR sea correcto.")
      return
    }

    console.log("Registration found:", {
      id: regData.id,
      user_id: regData.user_id,
      event_id: regData.event_id,
      is_attended: regData.is_attended,
      attended_at: regData.attended_at
    })

    // Check if already attended
    if (regData.is_attended) {
      console.log("⚠️ User already marked as attended at:", regData.attended_at)
      setScanError(`Este usuario ya marcó asistencia el ${new Date(regData.attended_at).toLocaleString()}`)
      return
    }

    console.log("📝 Marking attendance for registration ID:", regData.id)

    // Mark attendance
    const { data: updateData, error: updateError } = await supabase
      .from("event_registrations")
      .update({
        is_attended: true,
        attended_at: new Date().toISOString(),
      })
      .eq("id", regData.id)
      .select()

    console.log("Update result:", updateData)
    console.log("Update error:", updateError)

    if (updateError) {
      console.error("❌ Error updating attendance:", updateError)
      setScanError("Error al marcar asistencia: " + updateError.message)
      return
    }

    console.log("✅ Attendance marked successfully for user:", regData.user_id)
    setScanSuccess(`¡Asistencia registrada exitosamente!`)
    
    // Refresh attendees list immediately
    await fetchAttendees()
    
    // Refresh event data
    await fetchEvent()
    
    console.log("=== QR SCAN COMPLETED ===")
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

  const handleResourceUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resourceFile || !resourceTitle || !user || !event) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setIsUploadingResource(true)

    try {
      // Determine resource type based on file extension
      const fileExtension = resourceFile.name.split('.').pop()?.toLowerCase()
      let detectedType = resourceType
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
        detectedType = 'photo'
      } else if (fileExtension === 'pdf') {
        detectedType = 'pdf'
      } else {
        detectedType = 'document'
      }

      // Upload file to Supabase Storage
      // Sanitize filename to avoid special characters
      const sanitizedFileName = resourceFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^\w\s.-]/g, "") // Remove special chars except . - and spaces
        .replace(/\s+/g, "_") // Replace spaces with underscores
      
      const fileName = `${event.id}/${Date.now()}-${sanitizedFileName}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Recursos-Eventos')
        .upload(fileName, resourceFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Error al subir el archivo: " + uploadError.message)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Recursos-Eventos')
        .getPublicUrl(fileName)

      // Save resource metadata to database
      const { error: dbError } = await supabase
        .from('event_resources')
        .insert({
          event_id: event.id,
          title: resourceTitle,
          description: resourceDescription,
          resource_url: publicUrl,
          resource_type: detectedType,
          file_name: resourceFile.name,
          file_size: resourceFile.size,
          uploaded_by: user.id
        })

      if (dbError) {
        console.error("Database error:", dbError)
        alert("Error al guardar el recurso: " + dbError.message)
        return
      }

      // Reset form and close modal
      setResourceTitle("")
      setResourceDescription("")
      setResourceFile(null)
      setShowResourceModal(false)
      alert("✅ Recurso subido exitosamente")
      
      // Refresh event data and resources
      await fetchEvent()
      await fetchEventResources()

    } catch (error) {
      console.error("Error:", error)
      alert("Error inesperado al subir el recurso")
    } finally {
      setIsUploadingResource(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResourceFile(e.target.files[0])
    }
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

      {/* Resource Upload Modal */}
      <Dialog open={showResourceModal} onOpenChange={setShowResourceModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Añadir Recurso del Evento
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResourceUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resourceTitle">Título del Recurso *</Label>
              <input
                id="resourceTitle"
                type="text"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Ej: Presentación del taller"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourceDescription">Descripción</Label>
              <textarea
                id="resourceDescription"
                value={resourceDescription}
                onChange={(e) => setResourceDescription(e.target.value)}
                placeholder="Describe el recurso (opcional)"
                className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourceType">Tipo de Recurso</Label>
              <select
                id="resourceType"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="document">Documento</option>
                <option value="pdf">PDF</option>
                <option value="photo">Foto</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourceFile">Archivo *</Label>
              <div className="flex items-center gap-2">
                <input
                  id="resourceFile"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              {resourceFile && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {resourceFile.name} ({(resourceFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResourceModal(false)
                  setResourceTitle("")
                  setResourceDescription("")
                  setResourceFile(null)
                }}
                disabled={isUploadingResource}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUploadingResource}
                className="gap-2"
              >
                {isUploadingResource ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir Recurso
                  </>
                )}
              </Button>
            </div>
          </form>
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

                {/* Add Resources */}
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Recursos del Evento
                    </CardTitle>
                    <CardDescription>
                      Sube materiales y recursos para los asistentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setShowResourceModal(true)}
                      className="w-full gap-2"
                      variant="secondary"
                    >
                      <Upload className="w-4 h-4" />
                      Añadir Recursos
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
                <Card className="w-80">
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

                    {/* Resources Section - Right below QR */}
                    <div className="border-t pt-4 mt-4">
                      {registration.is_attended && registration.attended_at ? (
                        <>
                          <Alert className="bg-green-500/10 border-green-500/20 mb-4">
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
                          
                          {/* Show event resources from event_resources table - Collapsible */}
                          {eventResources.length > 0 ? (
                            <Collapsible open={isResourcesOpen} onOpenChange={setIsResourcesOpen}>
                              <CollapsibleTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className="w-full justify-between mb-3"
                                >
                                  <span className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Recursos del Evento ({eventResources.length})
                                  </span>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="space-y-3">
                                {eventResources.map((resource) => (
                                  <div key={resource.id} className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                        {resource.resource_type === 'pdf' || resource.file_name?.endsWith('.pdf') ? (
                                          <FileText className="w-5 h-5 text-primary" />
                                        ) : (
                                          <Download className="w-5 h-5 text-primary" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-foreground mb-1">
                                          {resource.title}
                                        </h4>
                                        {resource.description && (
                                          <p className="text-sm text-muted-foreground mb-2">
                                            {resource.description}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                          {resource.file_name} • {resource.resource_type === 'pdf' ? 'PDF' : resource.resource_type === 'zip' ? 'ZIP' : 'Documento'}
                                        </p>
                                      </div>
                                    </div>
                                    <a 
                                      href={resource.resource_url} 
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button className="w-full gap-2">
                                        <Download className="w-4 h-4" />
                                        Descargar
                                      </Button>
                                    </a>
                                  </div>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <Alert>
                              <AlertDescription>
                                No hay recursos disponibles para este evento.
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Button to see available courses - Simplified with gradient */}
                          <Link href="/courses" className="block mt-4">
                            <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                              Ver Cursos Relacionados
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/20 mb-4">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                              ⏳ Pendiente de check-in. Muestra tu código QR en el evento para acceder a los recursos.
                            </AlertDescription>
                          </Alert>
                          
                          <Button 
                            onClick={fetchEvent} 
                            variant="outline" 
                            className="w-full mb-4"
                          >
                            🔄 Actualizar Estado
                          </Button>
                          
                          {eventResources.length > 0 && (
                            <div className="bg-muted/50 border border-border rounded-lg p-4">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  <Download className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-foreground mb-1">
                                    🔒 {eventResources.length} Recurso{eventResources.length > 1 ? 's' : ''} Bloqueado{eventResources.length > 1 ? 's' : ''}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Completa el check-in en el evento para acceder a los recursos
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {eventResources.map((resource) => (
                                  <div key={resource.id} className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/30 rounded">
                                    <FileText className="w-4 h-4" />
                                    <span>{resource.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
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
