import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Link, redirect } from "@/lib/i18n/routing"
import { CertificatesClient } from "./certificates-client"

export default async function AdminCertificatesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const profileResponse = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

  if (profileResponse.data?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all certificates directly from certificates table
  // This ensures we get ALL certificates, not just those with status "completed"
  const { data: certificatesData } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      issue_date,
      credential_id,
      credential:microcredentials!inner(
        id,
        student_id,
        course_id,
        status,
        issue_date,
        course:courses(
          id,
          title
        )
      )
    `)
    .order("issue_date", { ascending: false })

  // Get unique student IDs from all certificates
  const studentIds = [
    ...new Set(
      (certificatesData || [])
        .map((cert) => (cert.credential as any)?.student_id)
        .filter((id) => id !== null && id !== undefined)
    ),
  ]

  // Fetch user profiles for these students
  let usersData: any[] = []
  if (studentIds.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", studentIds)
    usersData = data || []
  }

  // Group certificates by user
  const usersWithCertificates = usersData.map((user) => {
    const userCertificates = (certificatesData || [])
      .filter((cert) => (cert.credential as any)?.student_id === user.id)
      .map((cert) => {
        const credential = cert.credential as any
        return {
          id: cert.id,
          certificate_number: cert.certificate_number,
          issue_date: cert.issue_date,
          credential_id: cert.credential_id,
          student_id: credential?.student_id,
          course: credential?.course || null,
          course_id: credential?.course_id,
          status: credential?.status,
          certificate: {
            certificate_number: cert.certificate_number,
            issue_date: cert.issue_date,
          },
        }
      })

    return {
      ...user,
      certificates: userCertificates,
      certificateCount: userCertificates.length,
    }
  })

  // Sort by certificate count (descending) and then by name
  usersWithCertificates.sort((a, b) => {
    if (b.certificateCount !== a.certificateCount) {
      return b.certificateCount - a.certificateCount
    }
    return (a.full_name || a.email).localeCompare(b.full_name || b.email)
  })

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Usuarios con Certificados</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona y visualiza todos los usuarios que han obtenido certificados
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CertificatesClient initialUsers={usersWithCertificates} />
      </div>
    </main>
  )
}

