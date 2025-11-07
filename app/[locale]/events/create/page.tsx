"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { Link, useRouter } from "@/lib/i18n/routing"

export default function CreateEventPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    max_attendees: "",
    resources_url: "",
  })

  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert("Please log in to create an event")
      router.push("/auth/login")
      return
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
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        resources_url: formData.resources_url || null,
        organizer_id: user.id,
        status: "upcoming",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating event:", error)
      alert("Error creating event")
      setIsCreating(false)
      return
    }

    alert("Event created successfully!")
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
            <CardTitle className="text-3xl">Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Web Development Workshop"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your event..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date *</Label>
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
                  <Label htmlFor="event_time">Event Time *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Main Auditorium, Building A"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attendees">Maximum Attendees (Optional)</Label>
                <Input
                  id="max_attendees"
                  name="max_attendees"
                  type="number"
                  placeholder="100"
                  value={formData.max_attendees}
                  onChange={handleChange}
                  min="1"
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty for unlimited attendees
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resources_url">Resources URL (Optional)</Label>
                <Input
                  id="resources_url"
                  name="resources_url"
                  type="url"
                  placeholder="https://example.com/resources"
                  value={formData.resources_url}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  URL to event resources (accessible after check-in)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? "Creating..." : "Create Event"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
