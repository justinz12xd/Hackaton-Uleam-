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
import { Search, Award, User, Calendar, ExternalLink } from "lucide-react"
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

interface Certificate {
  id: string
  course_title: string
  issued_at: string
  certificate_url: string
}

export function UserSearch() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false)

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

  const loadUserCertificates = async (userId: string) => {
    setIsLoadingCertificates(true)
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        id,
        issued_at,
        certificate_url,
        courses!inner(title)
      `)
      .eq("user_id", userId)
      .order("issued_at", { ascending: false })

    if (!error && data) {
      const formattedCertificates = data.map((cert: any) => ({
        id: cert.id,
        course_title: cert.courses.title,
        issued_at: cert.issued_at,
        certificate_url: cert.certificate_url,
      }))
      setCertificates(formattedCertificates)
    }
    setIsLoadingCertificates(false)
  }

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user)
    loadUserCertificates(user.id)
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
                      setCertificates([])
                    }}
                  >
                    Back
                  </Button>
                </div>

                {/* Certificates */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">
                      Microcredentials ({certificates.length})
                    </h4>
                  </div>

                  {isLoadingCertificates ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading certificates...
                    </div>
                  ) : certificates.length > 0 ? (
                    <div className="space-y-3">
                      {certificates.map((cert) => (
                        <Card key={cert.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-start justify-between">
                              <span className="flex-1">{cert.course_title}</span>
                              <Badge variant="secondary" className="ml-2">
                                <Award className="w-3 h-3 mr-1" />
                                Earned
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(cert.issued_at)}</span>
                            </div>
                            {cert.certificate_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  window.open(cert.certificate_url, "_blank")
                                }
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Certificate
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No microcredentials earned yet</p>
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
