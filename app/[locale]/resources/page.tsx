"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, FileText, Image as ImageIcon, Download, Calendar, MapPin } from "lucide-react"
import { Link } from "@/lib/i18n/routing"
import { Badge } from "@/components/ui/badge"

interface EventResource {
  id: string
  event_id: string
  title: string
  description: string | null
  resource_url: string
  resource_type: string
  file_name: string | null
  file_size: number | null
  created_at: string
  events: {
    title: string
    event_date: string
    location: string
  }
  profiles: {
    full_name: string | null
    email: string
  }
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<EventResource[]>([])
  const [filteredResources, setFilteredResources] = useState<EventResource[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchResources()
    }
  }, [user])

  useEffect(() => {
    filterResources()
  }, [searchQuery, selectedType, resources])

  const checkUser = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchResources = async () => {
    if (!user) return
    
    setIsLoading(true)
    const supabase = createClient()

    console.log("Fetching resources for user:", user.id)

    try {
      // Get resources from events the user has attended or organized
      const { data, error } = await supabase
        .from("event_resources")
        .select(`
          *,
          events!inner(
            title,
            event_date,
            location,
            organizer_id
          ),
          profiles!event_resources_uploaded_by_fkey(
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })

      console.log("Raw resources data:", data)
      console.log("Resources error:", error)

      if (error) {
        console.error("Error fetching resources:", error)
        setIsLoading(false)
        return
      }

      // Get events where user has attended
      const { data: attendedEvents, error: attendedError } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("is_attended", true)

      console.log("Attended events:", attendedEvents)
      console.log("Attended events error:", attendedError)

      const attendedEventIds = attendedEvents?.map(reg => reg.event_id) || []

      // Filter resources where user attended the event or is the organizer
      const filtered = data?.filter((resource: any) => {
        const isAttended = attendedEventIds.includes(resource.event_id)
        const isOrganizer = resource.events.organizer_id === user.id
        console.log(`Resource ${resource.title}: attended=${isAttended}, organizer=${isOrganizer}`)
        return isAttended || isOrganizer
      }) || []

      console.log("Filtered resources:", filtered)

      setResources(filtered)
      setFilteredResources(filtered)
    } catch (err) {
      console.error("Unexpected error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterResources = () => {
    let filtered = resources

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.events.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by resource type
    if (selectedType !== "all") {
      filtered = filtered.filter(
        (resource) => resource.resource_type === selectedType
      )
    }

    setFilteredResources(filtered)
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "photo":
        return <ImageIcon className="w-5 h-5" />
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />
      case "document":
        return <FileText className="w-5 h-5 text-blue-500" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Tamaño desconocido"
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>
              Debes iniciar sesión para ver los recursos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/events" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Volver a Eventos
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">📚 Recursos de Eventos</h1>
          <p className="text-lg text-muted-foreground">
            Accede a todos los materiales y recursos de los eventos en los que has participado
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recursos por título o evento..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
              >
                Todos {selectedType === "all" && `(${filteredResources.length})`}
              </Button>
              <Button
                variant={selectedType === "photo" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("photo")}
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                Fotos
              </Button>
              <Button
                variant={selectedType === "pdf" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("pdf")}
              >
                <FileText className="w-4 h-4 mr-1" />
                PDFs
              </Button>
              <Button
                variant={selectedType === "document" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("document")}
              >
                <FileText className="w-4 h-4 mr-1" />
                Documentos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Cargando recursos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-40 flex items-center justify-center">
                    {resource.resource_type === "photo" && resource.resource_url ? (
                      <img 
                        src={resource.resource_url} 
                        alt={resource.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getResourceIcon(resource.resource_type)
                    )}
                  </div>
                  <CardHeader className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">
                        {resource.resource_type.toUpperCase()}
                      </Badge>
                      {resource.file_size && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(resource.file_size)}
                        </span>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                    {resource.description && (
                      <CardDescription className="line-clamp-2">
                        {resource.description}
                      </CardDescription>
                    )}
                    <div className="pt-2 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{resource.events.title}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {new Date(resource.events.event_date).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <a href={resource.resource_url} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full gap-2">
                        <Download className="w-4 h-4" />
                        Descargar / Ver
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {searchQuery || selectedType !== "all"
                    ? "No se encontraron recursos que coincidan con tu búsqueda"
                    : "No tienes recursos disponibles aún"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Los recursos aparecerán aquí cuando asistas a eventos que los proporcionen
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
