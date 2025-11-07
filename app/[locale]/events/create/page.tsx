"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react"
import { Link, useRouter } from "@/lib/i18n/routing"

export default function CreateEventPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    location_type: "presencial",
    max_attendees: "",
    resources_url: "",
    category: "",
    tags: "",
  })

  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB')
        return
      }

      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!imageFile) return null

    setUploadingImage(true)

    try {
      // Create unique filename
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('Event-pictures')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading image:', error)
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Event-pictures')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert("Por favor inicia sesión para crear un evento")
      router.push("/auth/login")
      setIsCreating(false)
      return
    }

    // Upload image first if exists
    let imageUrl = null
    if (imageFile) {
      imageUrl = await uploadImage(user.id)
      if (!imageUrl) {
        alert("Error al subir la imagen. El evento se creará sin imagen.")
      }
    }

    // Combine date and time
    const eventDateTime = `${formData.event_date}T${formData.event_time}:00`

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: formData.title,
        description: formData.description,
        event_date: eventDateTime,
        location: formData.location,
        image_url: imageUrl,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        resources_url: formData.resources_url || null,
        organizer_id: user.id,
        status: "upcoming",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating event:", error)
      alert("Error al crear el evento")
      setIsCreating(false)
      return
    }

    alert("¡Evento creado exitosamente!")
    router.push(`/events/${data.id}`)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/events" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Crear Nuevo Evento</CardTitle>
            <p className="text-muted-foreground mt-2">
              Completa la información del evento. Los campos marcados con * son obligatorios.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Imagen del Evento</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <Label
                        htmlFor="image-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Subir Imagen
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        PNG, JPG, GIF hasta 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título del Evento *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Taller de Desarrollo Web"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe tu evento, qué aprenderán los asistentes, qué necesitan traer..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Incluye detalles importantes sobre el contenido, requisitos y beneficios del evento
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Fecha del Evento *</Label>
                  <Input
                    id="event_date"
                    name="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_time">Hora del Evento *</Label>
                  <Input
                    id="event_time"
                    name="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_type">Tipo de Evento *</Label>
                  <Select
                    value={formData.location_type}
                    onValueChange={(value) => setFormData({ ...formData, location_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    {formData.location_type === "virtual" ? "Enlace de la reunión *" : "Ubicación *"}
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder={
                      formData.location_type === "virtual"
                        ? "https://meet.google.com/..."
                        : "Auditorio Principal, Edificio A"
                    }
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnologia">Tecnología</SelectItem>
                      <SelectItem value="negocios">Negocios</SelectItem>
                      <SelectItem value="educacion">Educación</SelectItem>
                      <SelectItem value="arte">Arte y Cultura</SelectItem>
                      <SelectItem value="ciencia">Ciencia</SelectItem>
                      <SelectItem value="deportes">Deportes</SelectItem>
                      <SelectItem value="salud">Salud y Bienestar</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Máximo de Asistentes</Label>
                  <Input
                    id="max_attendees"
                    name="max_attendees"
                    type="number"
                    placeholder="100"
                    value={formData.max_attendees}
                    onChange={handleChange}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dejar vacío para asistentes ilimitados
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="javascript, react, workshop"
                  value={formData.tags}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Separa las etiquetas con comas para facilitar la búsqueda
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resources_url">URL de Recursos</Label>
                <Input
                  id="resources_url"
                  name="resources_url"
                  type="url"
                  placeholder="https://ejemplo.com/recursos"
                  value={formData.resources_url}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Los asistentes podrán acceder a estos recursos después del check-in
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isCreating || uploadingImage}
                  className="flex-1"
                >
                  {isCreating ? "Creando evento..." : uploadingImage ? "Subiendo imagen..." : "Crear Evento"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isCreating || uploadingImage}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
