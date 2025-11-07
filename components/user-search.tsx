"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  MapPin,
  Search,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslations } from "next-intl"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface AttendedEvent {
  id: string
  event_title: string
  event_date: string
  location: string
  attended_at: string
  is_collaborator: boolean
}

export function UserSearch() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [events, setEvents] = useState<AttendedEvent[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const t = useTranslations('userSearch')

  // Memoizar el cliente de Supabase para evitar recrearlo en cada render
  const supabase = useMemo(() => createClient(), [])

  // Memoizar la función de búsqueda para evitar recrearla en cada render
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setUsers([])
      setIsLoadingUsers(false)
      return
    }

    setIsLoadingUsers(true)
    setUsers([])

    try {
      const trimmedQuery = query.trim()
      const searchPattern = `%${trimmedQuery}%`

      // Hacer las búsquedas reales
      const [emailResponse, nameResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url")
          .ilike("email", searchPattern)
          .limit(10),
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url")
          .not("full_name", "is", null)
          .ilike("full_name", searchPattern)
          .limit(10),
      ])

      // Procesar resultados
      const emailUsers = emailResponse.data || []
      const nameUsers = nameResponse.data || []

      // Combinar y deduplicar
      const allUsers = [...emailUsers, ...nameUsers]
      const uniqueUsers = allUsers.filter(
        (user, index, self) => index === self.findIndex((u) => u.id === user.id)
      )

      setUsers(uniqueUsers.slice(0, 10))
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setUsers([])
    } finally {
      setIsLoadingUsers(false)
    }
  }, [supabase])

  // useEffect para manejar la búsqueda con debounce
  useEffect(() => {
    if (!open) {
      setUsers([])
      setIsLoadingUsers(false)
      return
    }

    // Limpiar resultados si la búsqueda es muy corta
    if (searchQuery.trim().length < 3) {
      setUsers([])
      setIsLoadingUsers(false)
      return
    }

    // Debounce: esperar 500ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery).catch((err) => {
        console.error("Error al ejecutar performSearch:", err)
      })
    }, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [searchQuery, open, performSearch])

  // Memoizar loadUserEvents para evitar recrearlo en cada render
  const loadUserEvents = useCallback(async (userId: string) => {
    setIsLoadingEvents(true)
    try {
      // Primero obtener las registraciones del usuario
      const { data: registrations, error: regError } = await supabase
        .from("event_registrations")
        .select("id, event_id, attended_at, is_collaborator")
        .eq("user_id", userId)
        .eq("is_attended", true)
        .order("attended_at", { ascending: false })

      if (regError) {
        console.error("Error loading user registrations:", regError)
        setEvents([])
        return
      }

      if (!registrations || registrations.length === 0) {
        setEvents([])
        return
      }

      // Obtener los eventos correspondientes
      const eventIds = registrations.map(r => r.event_id)
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, title, event_date, location")
        .in("id", eventIds)

      if (eventsError) {
        console.error("Error loading events:", eventsError)
        setEvents([])
        return
      }

      // Combinar los datos
        const formattedEvents = registrations.map((reg) => {
          const eventData = eventsData?.find(e => e.id === reg.event_id)
          return {
            id: reg.id,
            event_title: eventData?.title || t('unknownEvent'),
            event_date: eventData?.event_date || new Date().toISOString(),
            location: eventData?.location || t('unknownLocation'),
            attended_at: reg.attended_at,
            is_collaborator: reg.is_collaborator,
          }
        })

      setEvents(formattedEvents)
    } catch (err) {
      console.error("Error loading user events:", err)
      setEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }, [supabase])

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user)
    loadUserEvents(user.id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset state when modal closes
      setSearchQuery("")
      setUsers([])
      setSelectedUser(null)
      setEvents([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">{t('search')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search Section */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Results Section */}
          <div className="flex-1 overflow-hidden">
            {!selectedUser ? (
              // User List
              <ScrollArea className="h-[400px]">
                <Command>
                  <CommandList>
                    {isLoadingUsers ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {t('searching')}
                      </div>
                    ) : users.length > 0 ? (
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => handleSelectUser(user)}
                            className="flex items-center gap-3 p-3 cursor-pointer"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>
                                {user.full_name
                                  ? user.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                  : user.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">
                                {user.full_name || t('noName')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : searchQuery.length > 2 ? (
                      <CommandEmpty>{t('noUsers')}</CommandEmpty>
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {t('typeToSearch')}
                      </div>
                    )}
                  </CommandList>
                </Command>
              </ScrollArea>
            ) : (
              // User Profile & Certificates
              <div className="space-y-4 h-[400px] overflow-y-auto">
                {/* User Header */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedUser.full_name
                        ? selectedUser.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : selectedUser.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedUser.full_name || t('noName')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(null)
                      setEvents([])
                    }}
                  >
                    {t('back')}
                  </Button>
                </div>

                {/* Events */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">
                      {t('attendedEventsCount', { count: events.length })}
                    </h4>
                  </div>

                  {isLoadingEvents ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('loadingEvents')}
                    </div>
                  ) : events.length > 0 ? (
                    <div className="space-y-3">
                      {events.map((event: AttendedEvent) => (
                        <Card key={event.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-start justify-between">
                              <span className="flex-1">{event.event_title}</span>
                              <Badge variant="secondary" className="ml-2">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('attended')}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(event.event_date)}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground pt-1">
                              {t('attendedAt')} {formatDate(event.attended_at)}
                            </div>
                            {event.is_collaborator && (
                              <Badge variant="outline" className="mt-2">
                                <Users className="w-3 h-3 mr-1" />
                                {t('collaborator')}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t('noEvents')}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
