import CertificateView from "@/components/certificates/certificate-view"
import { createServiceClient } from "@/lib/supabase/service"
import { notFound } from "next/navigation"
import QRCode from "qrcode"
import { getBaseUrl } from "@/lib/utils/url"

interface CertificatePageProps {
  params: Promise<{
    certificateNumber: string
  }>
}

export default async function CertificatePublicPage({ params }: CertificatePageProps) {
  const { certificateNumber } = await params

  let supabaseClient: ReturnType<typeof createServiceClient> | null = null
  try {
    supabaseClient = createServiceClient()
  } catch (error) {
    console.error("Service client not configured for certificates", error)
    notFound()
  }

  if (!supabaseClient) {
    notFound()
  }

  const { data: record } = await supabaseClient
    .from("certificates")
    .select(
      `certificate_number, issue_date, credential:microcredentials (
        metadata,
        issue_date,
        course:courses (title),
        student:profiles (full_name)
      )`
    )
    .eq("certificate_number", certificateNumber)
    .maybeSingle()

  if (!record) {
    notFound()
  }

  const credential = record.credential as any
  const metadata = (credential?.metadata || {}) as Record<string, any>

  const participantName = metadata.participantName || credential?.student?.full_name || "Participante"
  const courseName = metadata.courseTitle || credential?.course?.title || "Curso"
  const eventName = metadata.eventTitle || null
  const organizerName = metadata.organizerName || null
  const issueDate = new Date(record.issue_date || credential?.issue_date || new Date())
    .toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const baseUrl = getBaseUrl()
  const verificationUrl = metadata.verificationUrl || `${baseUrl.replace(/\/$/, "")}/certificates/${certificateNumber}`

  let qrCodeDataUrl = metadata.qrCodeDataUrl || null
  if (!qrCodeDataUrl) {
    qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1 })
  }

  return (
    <main className="min-h-screen bg-slate-100 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <CertificateView
          participantName={participantName}
          courseName={courseName}
          eventName={eventName}
          organizerName={organizerName}
          issueDate={issueDate}
          certificateNumber={certificateNumber}
          qrCodeDataUrl={qrCodeDataUrl}
          verificationUrl={verificationUrl}
        />
      </div>
    </main>
  )
}

