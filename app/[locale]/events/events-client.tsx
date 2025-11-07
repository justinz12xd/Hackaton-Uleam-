"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users } from "lucide-react"
import { Link } from "@/lib/i18n/routing"

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
  created_at: string
  registrations_count?: number
  is_registered?: boolean
}

interface EventsClientProps {
  initialEvents: Event[]
  user: any
}

export function EventsClient({ initialEvents, user }: EventsClientProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
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

  const getEventStatus = (event: Event) => {
    const now = new Date()
    const eventDate = new Date(event.event_date)

    if (event.status === "completed") return "Completed"
    if (event.status === "ongoing") return "Ongoing"
    if (eventDate < now) return "Past"
    return "Upcoming"
  }

  // Group events by date
  const groupedEvents = initialEvents.reduce((acc, event) => {
    const date = new Date(event.event_date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })
    const dayOfWeek = new Date(event.event_date).toLocaleDateString("es-ES", {
      weekday: "long",
    })
    const key = `${date}|${dayOfWeek}`
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, typeof initialEvents>)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {initialEvents.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
            const [date, dayOfWeek] = dateKey.split("|")
            return (
              <div key={dateKey} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground">{date}</span>
                    <span className="w-1 h-1 rounded-full bg-muted"></span>
                  </div>
                  <h2 className="text-sm text-muted-foreground capitalize">{dayOfWeek}</h2>
                </div>

                {/* Events for this date */}
                <div className="space-y-3">
                  {dateEvents.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                        <div className="flex gap-4 p-4">
                          {/* Event Image */}
                          <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                            {event.image_url ? (
                              <img
                                src={event.image_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Event Info */}
                          <div className="flex-1 min-w-0">
                            {/* Status Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              {getEventStatus(event) === "Ongoing" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                  EN VIVO
                                </span>
                              )}
                              <span className="text-sm text-muted-foreground">{formatTime(event.event_date)}</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                              {event.title}
                            </h3>

                            {/* Organizer & Location */}
                            <div className="space-y-1 mb-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span className="line-clamp-1">{event.registrations_count || 0} asistentes</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span className="line-clamp-1">{event.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center gap-3">
                              {event.is_registered ? (
                                <span className="px-3 py-1 rounded text-sm font-medium bg-green-500/10 text-green-600">
                                  Registrado
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                  Unirse al evento →
                                </span>
                              )}
                              {(event.registrations_count ?? 0) > 0 && (
                                <div className="flex items-center -space-x-2">
                                  {Array.from({ length: Math.min(event.registrations_count ?? 0, 3) }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/70 border-2 border-background"
                                    />
                                  ))}
                                  {(event.registrations_count ?? 0) > 3 && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      +{(event.registrations_count ?? 0) - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-4">No hay eventos disponibles</p>
          {user && (
            <Link href="/events/create">
              <Button>Crear el primer evento</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

