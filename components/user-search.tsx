"use client"

import { useState, useEffect } from "react"
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

  const supabase = createClient()

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers()
    } else {
      setUsers([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    setIsLoadingUsers(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .limit(10)

    if (!error && data) {
      setUsers(data)
    }
    setIsLoadingUsers(false)
  }

  const loadUserEvents = async (userId: string) => {
    setIsLoadingEvents(true)
    const { data, error } = await supabase
      .from("event_registrations")
      .select(`
        id,
        attended_at,
        is_collaborator,
        events!inner(
          id,
          title,
          event_date,
          location
        )
      `)
      .eq("user_id", userId)
      .eq("is_attended", true)
      .order("attended_at", { ascending: false })

    if (!error && data) {
      const formattedEvents = data.map((reg: any) => ({
        id: reg.id,
        event_title: reg.events.title,
        event_date: reg.events.event_date,
        location: reg.events.location,
        attended_at: reg.attended_at,
        is_collaborator: reg.is_collaborator,
      }))
      setEvents(formattedEvents)
    }
    setIsLoadingEvents(false)
  }

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Search Users</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Users & Microcredentials</DialogTitle>
          <DialogDescription>
            Find users and view their earned microcredentials
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search Section */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
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
                        Searching...
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
                                {user.full_name || "No name"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : searchQuery.length > 2 ? (
                      <CommandEmpty>No users found</CommandEmpty>
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Type at least 3 characters to search
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
                      {selectedUser.full_name || "No name"}
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
                    Back
                  </Button>
                </div>

                {/* Events */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">
                      Eventos Asistidos ({events.length})
                    </h4>
                  </div>

                  {isLoadingEvents ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Cargando eventos...
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
                                Asistió
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
                              Asistió: {formatDate(event.attended_at)}
                            </div>
                            {event.is_collaborator && (
                              <Badge variant="outline" className="mt-2">
                                <Users className="w-3 h-3 mr-1" />
                                Colaborador
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
                        <p>No ha asistido a ningún evento aún</p>
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
