"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Award, Calendar, User, Mail, Filter, X, SlidersHorizontal } from "lucide-react"
import { Link } from "@/lib/i18n/routing"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Certificate {
  id: string
  certificate_number: string
  issue_date: string
  credential_id: string
  student_id: string
  course: {
    id: string
    title: string
  } | null
  course_id: string
  status: string
  certificate: {
    certificate_number: string
    issue_date: string
  }
}

interface UserWithCertificates {
  id: string
  full_name: string | null
  email: string
  role: string
  created_at: string
  certificates: Certificate[]
  certificateCount: number
}

interface CertificatesClientProps {
  initialUsers: UserWithCertificates[]
}

export function CertificatesClient({ initialUsers }: CertificatesClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [certCountFilter, setCertCountFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("certificates-desc")

  // Get unique courses from all certificates
  const uniqueCourses = useMemo(() => {
    const coursesMap = new Map<string, string>()
    initialUsers.forEach((user) => {
      user.certificates.forEach((cert) => {
        if (cert.course && cert.course.id && cert.course.title) {
          coursesMap.set(cert.course.id, cert.course.title)
        }
      })
    })
    return Array.from(coursesMap.entries()).map(([id, title]) => ({ id, title }))
  }, [initialUsers])

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = initialUsers

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.certificates.some(
            (cert) =>
              cert.course?.title.toLowerCase().includes(query) ||
              cert.certificate?.certificate_number.toLowerCase().includes(query)
          )
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case "last-month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "last-3-months":
          filterDate.setMonth(now.getMonth() - 3)
          break
        case "last-6-months":
          filterDate.setMonth(now.getMonth() - 6)
          break
        case "last-year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filtered = filtered
        .map((user) => ({
          ...user,
          certificates: user.certificates.filter(
            (cert) => new Date(cert.issue_date) >= filterDate
          ),
        }))
        .filter((user) => user.certificates.length > 0)
        .map((user) => ({
          ...user,
          certificateCount: user.certificates.length,
        }))
    }

    // Certificate count filter
    if (certCountFilter !== "all") {
      switch (certCountFilter) {
        case "1":
          filtered = filtered.filter((user) => user.certificateCount === 1)
          break
        case "2-5":
          filtered = filtered.filter(
            (user) => user.certificateCount >= 2 && user.certificateCount <= 5
          )
          break
        case "6+":
          filtered = filtered.filter((user) => user.certificateCount >= 6)
          break
      }
    }

    // Course filter
    if (courseFilter !== "all") {
      filtered = filtered
        .map((user) => ({
          ...user,
          certificates: user.certificates.filter((cert) => cert.course?.id === courseFilter),
        }))
        .filter((user) => user.certificates.length > 0)
        .map((user) => ({
          ...user,
          certificateCount: user.certificates.length,
        }))
    }

    // Sort
    const sorted = [...filtered]
    switch (sortBy) {
      case "name-asc":
        sorted.sort((a, b) =>
          (a.full_name || a.email).localeCompare(b.full_name || b.email)
        )
        break
      case "name-desc":
        sorted.sort((a, b) =>
          (b.full_name || b.email).localeCompare(a.full_name || a.email)
        )
        break
      case "certificates-asc":
        sorted.sort((a, b) => a.certificateCount - b.certificateCount)
        break
      case "certificates-desc":
        sorted.sort((a, b) => b.certificateCount - a.certificateCount)
        break
      case "date-asc":
        sorted.sort((a, b) => {
          const dateA = a.certificates[0]?.issue_date || ""
          const dateB = b.certificates[0]?.issue_date || ""
          return new Date(dateA).getTime() - new Date(dateB).getTime()
        })
        break
      case "date-desc":
        sorted.sort((a, b) => {
          const dateA = a.certificates[0]?.issue_date || ""
          const dateB = b.certificates[0]?.issue_date || ""
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        })
        break
    }

    return sorted
  }, [searchQuery, roleFilter, dateFilter, certCountFilter, courseFilter, sortBy, initialUsers])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const hasActiveFilters = roleFilter !== "all" || dateFilter !== "all" || certCountFilter !== "all" || courseFilter !== "all"

  const clearFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setDateFilter("all")
    setCertCountFilter("all")
    setCourseFilter("all")
    setSortBy("certificates-desc")
  }

  return (
    <>
      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, curso o número de certificado..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Advanced Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="student">Estudiante</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="last-month">Último mes</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
              <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
              <SelectItem value="last-year">Último año</SelectItem>
            </SelectContent>
          </Select>

          {/* Certificate Count Filter */}
          <Select value={certCountFilter} onValueChange={setCertCountFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Certificados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier cantidad</SelectItem>
              <SelectItem value="1">1 certificado</SelectItem>
              <SelectItem value="2-5">2-5 certificados</SelectItem>
              <SelectItem value="6+">6+ certificados</SelectItem>
            </SelectContent>
          </Select>

          {/* Course Filter */}
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {uniqueCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="certificates-desc">Más certificados</SelectItem>
              <SelectItem value="certificates-asc">Menos certificados</SelectItem>
              <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
              <SelectItem value="date-desc">Más reciente</SelectItem>
              <SelectItem value="date-asc">Más antiguo</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(hasActiveFilters || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} {filteredUsers.length === 1 ? "usuario encontrado" : "usuarios encontrados"}
            {initialUsers.length !== filteredUsers.length && (
              <span className="ml-1">de {initialUsers.length} total</span>
            )}
          </p>
          {hasActiveFilters && (
            <Badge variant="secondary" className="gap-2">
              <Filter className="h-3 w-3" />
              Filtros activos
            </Badge>
          )}
        </div>
      </div>

      {/* Users with Certificates */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios con Certificados ({filteredUsers.length})</CardTitle>
          <CardDescription>Lista de todos los usuarios que han obtenido certificados</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="space-y-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-6 hover:bg-muted/50 transition-colors space-y-4"
                >
                  {/* User Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {user.full_name || "Sin nombre"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground line-clamp-1">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="gap-2">
                        <Award className="h-3 w-3" />
                        {user.certificateCount} {user.certificateCount === 1 ? "certificado" : "certificados"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Certificates List */}
                  <div className="space-y-3 pl-16">
                    {user.certificates.map((cert, index) => {
                      const certificate = cert.certificate
                      const course = cert.course

                      return (
                        <div
                          key={`${cert.id}-${index}`}
                          className="flex items-center justify-between p-4 bg-background border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="h-4 w-4 text-primary flex-shrink-0" />
                              <h4 className="font-medium text-sm line-clamp-1">
                                {course?.title || "Curso completado"}
                              </h4>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {certificate?.certificate_number && (
                                <span className="font-mono">
                                  Certificado #{certificate.certificate_number}
                                </span>
                              )}
                              {cert.issue_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Emitido el {formatDate(cert.issue_date)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {certificate?.certificate_number && (
                            <Link href={`/certificates/${certificate.certificate_number}`} target="_blank">
                              <Button variant="outline" size="sm">
                                Ver Certificado
                              </Button>
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? "No se encontraron usuarios con los criterios de búsqueda" : "No hay usuarios con certificados"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

