import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 })
    }

    const { data: credential, error: credentialError } = await supabase
      .from("microcredentials")
      .select("id, qr_code_data, metadata, issue_date, certificates:certificates(*)")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle()

    if (credentialError) {
      console.error("Error fetching credential status:", credentialError)
      return NextResponse.json({ error: "Unable to fetch certificate status" }, { status: 500 })
    }

    if (!credential) {
      return NextResponse.json({ certificate: null })
    }

    const certificates = credential.certificates as any
    const certificateRecord = Array.isArray(certificates) ? certificates[0] : certificates

    if (!certificateRecord) {
      return NextResponse.json({ certificate: null })
    }

    const metadata = (credential.metadata || {}) as Record<string, any>

    return NextResponse.json({
      certificate: {
        certificateNumber: certificateRecord.certificate_number,
        credentialId: credential.id,
        verificationUrl: credential.qr_code_data || metadata.verificationUrl || null,
        qrCodeDataUrl: metadata.qrCodeDataUrl || null,
        issuedAt: certificateRecord.issue_date,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/certificates/status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


