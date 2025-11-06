import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2, Award } from "lucide-react"
import { Link, redirect } from "@/lib/i18n/routing"

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch user's completed courses and certificates
  const certificatesResponse = await supabase
    .from("microcredentials")
    .select("*, course:courses(*), certificate:certificates(*)")
    .eq("student_id", data.user.id)
    .eq("status", "completed")
    .order("issue_date", { ascending: false })

  const certificates = certificatesResponse.data || []

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
          <p className="text-muted-foreground mt-2">Download and share your earned microcredentials</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                {/* Certificate Visual */}
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border p-6 text-center">
                  <Award className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-sm text-foreground">Certificate of Completion</p>
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-2 text-lg">{(cert.course as any)?.title}</CardTitle>
                  <CardDescription className="text-xs mt-2">
                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Certificate Number</p>
                    <p className="text-xs font-mono font-semibold text-foreground">
                      {(cert.certificate as any)?.[0]?.certificate_number || "N/A"}
                    </p>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="border border-dashed border-border rounded p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-2">QR Code</p>
                    <div className="w-20 h-20 bg-muted rounded mx-auto" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent">
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent">
                      <Share2 className="w-3 h-3" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Award className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No certificates earned yet</p>
              <p className="text-sm text-muted-foreground">Complete courses to earn certificates</p>
              <Link href="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

