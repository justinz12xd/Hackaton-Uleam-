import { Resend } from "resend"

let resendClient: Resend | null = null

export function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  const client = getResendClient()
  if (!client) {
    console.warn("RESEND_API_KEY not configured. Skipping email send.")
    return
  }

  const fromEmail = from || process.env.RESEND_FROM_EMAIL || "certificados@hackathon.local"

  await client.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  })
}


