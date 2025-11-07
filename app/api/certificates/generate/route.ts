import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { sendEmail } from "@/lib/email/resend"
import { renderCertificateEmail } from "@/components/emails/certificate-email"
import { createAbsoluteUrl } from "@/lib/utils/url"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = authData.user

    const body = await request.json()
    const { courseId, enrollmentId, locale = "es", studentName, studentEmail, eventContext } = body

    if (!courseId || !enrollmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify course exists and get course data
    const courseResponse = await supabase.from("courses").select("*").eq("id", courseId).single()

    if (!courseResponse.data) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Verify enrollment exists
    const enrollmentResponse = await supabase
      .from("course_enrollments")
      .select("*")
      .eq("id", enrollmentId)
      .eq("student_id", currentUser.id)
      .single()

    if (!enrollmentResponse.data) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Generate certificate number
    const certificateNumber = `EDUC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const verificationUrl = createAbsoluteUrl(`/certificates/${certificateNumber}`, request)
    console.log("[certificates/generate]", {
      certificateNumber,
      verificationUrl,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      vercelUrl: process.env.VERCEL_URL,
    })
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1 })

    // Check if microcredential already exists
    const existingCredential = await supabase
      .from("microcredentials")
      .select("*")
      .eq("course_id", courseId)
      .eq("student_id", currentUser.id)
      .single()

    let credentialId

    const metadata = {
      eventId: eventContext?.id || null,
      eventTitle: eventContext?.title || null,
      organizerName: eventContext?.organizerName || null,
      participantName: studentName || currentUser.email || "Participante",
      courseTitle: courseResponse.data.title,
      verificationUrl,
      qrCodeDataUrl,
    }

    if (existingCredential.data) {
      // Update existing credential
      credentialId = existingCredential.data.id
      await supabase
        .from("microcredentials")
        .update({
          status: "completed",
          issue_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          qr_code_data: verificationUrl,
          metadata,
        })
        .eq("id", credentialId)
    } else {
      // Create new credential
      const credentialResponse = await supabase
        .from("microcredentials")
        .insert([
          {
            course_id: courseId,
            student_id: currentUser.id,
            status: "completed",
            issue_date: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            qr_code_data: verificationUrl,
            metadata,
          },
        ])
        .select()
        .single()

      credentialId = credentialResponse.data?.id
    }

    // Create or update certificate
    const certificateResponse = await supabase
      .from("certificates")
      .upsert([
        {
          credential_id: credentialId,
          certificate_number: certificateNumber,
          issue_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          pdf_url: null,
        },
      ])
      .select()
      .single()

    // Update enrollment as completed
    await supabase
      .from("course_enrollments")
      .update({
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
      })
      .eq("id", enrollmentId)

    const issuedAt = certificateResponse.data?.issue_date || new Date().toISOString()

    if (studentEmail) {
      const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      const emailHtml = renderCertificateEmail({
        participantName: studentName || currentUser.email || "Participante",
        courseName: courseResponse.data.title,
        eventName: eventContext?.title || null,
        organizerName: eventContext?.organizerName || null,
        issueDate: formatter.format(new Date(issuedAt)),
        certificateNumber,
        verificationUrl,
        qrCodeDataUrl,
      })

      try {
        await sendEmail({
          to: studentEmail,
          subject: `Tu certificado: ${courseResponse.data.title}`,
          html: emailHtml,
        })
      } catch (emailError) {
        console.warn("No se pudo enviar el correo del certificado", emailError)
      }
    }  

    return NextResponse.json({
      success: true,
      certificateNumber,
      credentialId,
      verificationUrl,
      qrCodeDataUrl,
      issuedAt,
    })
  } catch (error) {
    console.error("Error generating certificate:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
