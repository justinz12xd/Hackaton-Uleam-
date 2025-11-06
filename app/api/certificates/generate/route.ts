import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, enrollmentId } = body

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
      .eq("student_id", user.id)
      .single()

    if (!enrollmentResponse.data) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Generate certificate number
    const certificateNumber = `EDUC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create QR code data (in real app, would encode certificate info)
    const qrCodeData = JSON.stringify({
      certificateNumber,
      studentId: user.id,
      courseId,
      issuedAt: new Date().toISOString(),
    })

    // Check if microcredential already exists
    const existingCredential = await supabase
      .from("microcredentials")
      .select("*")
      .eq("course_id", courseId)
      .eq("student_id", user.id)
      .single()

    let credentialId

    if (existingCredential.data) {
      // Update existing credential
      credentialId = existingCredential.data.id
      await supabase
        .from("microcredentials")
        .update({
          status: "completed",
          issue_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          qr_code_data: qrCodeData,
        })
        .eq("id", credentialId)
    } else {
      // Create new credential
      const credentialResponse = await supabase
        .from("microcredentials")
        .insert([
          {
            course_id: courseId,
            student_id: user.id,
            status: "completed",
            issue_date: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            qr_code_data: qrCodeData,
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

    return NextResponse.json({
      success: true,
      certificateNumber,
      credentialId,
      qrCodeData,
    })
  } catch (error) {
    console.error("Error generating certificate:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
