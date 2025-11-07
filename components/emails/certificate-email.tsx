import React from "react"
import { render } from "@react-email/render"
import { CERTIFICATE_BASE_CSS } from "@/lib/certificates/styles"

interface CertificateEmailProps {
  participantName: string
  courseName: string
  eventName?: string | null
  organizerName?: string | null
  issueDate: string
  certificateNumber: string
  verificationUrl: string
  qrCodeDataUrl: string
}

const CERTIFICATE_CSS = `
  body {
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f5f5f7;
    color: #1f2933;
  }

  .email-wrapper {
    padding: 32px 0;
    display: flex;
    justify-content: center;
  }

  .cta-button {
    display: inline-block;
    padding: 12px 20px;
    margin-top: 20px;
    background: #4f46e5;
    color: #ffffff;
    text-decoration: none;
    border-radius: 10px;
    font-weight: 600;
  }
`

export function CertificateEmail({
  participantName,
  courseName,
  eventName,
  organizerName,
  issueDate,
  certificateNumber,
  verificationUrl,
  qrCodeDataUrl,
}: CertificateEmailProps) {
  const eventLabel = eventName ? `realizado en el marco del evento: ${eventName}` : null

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>Certificado de finalización</title>
        <style>{`${CERTIFICATE_CSS}\n${CERTIFICATE_BASE_CSS}`}</style>
      </head>
      <body>
        <div className="email-wrapper">
          <div className="certificate-wrapper">
            <div className="certificate-container">
              <div className="certificate-header">
                <h1 className="certificate-title">Certificado</h1>
                <p className="certificate-subtitle">de Participación</p>
              </div>

              <div className="certificate-body">
                <p className="certify-text">Se otorga el presente certificado a:</p>
                <div className="participant-name">{participantName}</div>
                <p className="certify-text">Por haber completado exitosamente el curso:</p>
                <div className="course-name">{courseName}</div>
                {eventLabel && <div className="certify-text">{eventLabel}</div>}
              </div>

              <div className="date-section">Emitido el {issueDate}</div>

              <div className="certificate-footer">
                <div className="signature-block">
                  <div className="signature-line"></div>
                  <div className="signature-name">{organizerName || "Organizador"}</div>
                  <div className="signature-title">Organizador del Evento</div>
                </div>
              </div>

              <div className="qr-section">
                <img src={qrCodeDataUrl} alt="Código QR del certificado" className="qr-code" />
                <div className="certificate-number">{certificateNumber}</div>
                <a href={verificationUrl} className="cta-button" target="_blank" rel="noreferrer">
                  Ver certificado en línea
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export function renderCertificateEmail(props: CertificateEmailProps) {
  return render(React.createElement(CertificateEmail, props))
}

