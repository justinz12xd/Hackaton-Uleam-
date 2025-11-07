'use client'

import { CERTIFICATE_BASE_CSS } from "@/lib/certificates/styles"

interface CertificateViewProps {
  participantName: string
  courseName: string
  eventName?: string | null
  organizerName?: string | null
  issueDate: string
  certificateNumber: string
  qrCodeDataUrl: string
  verificationUrl: string
}

export function CertificateView({
  participantName,
  courseName,
  eventName,
  organizerName,
  issueDate,
  certificateNumber,
  qrCodeDataUrl,
  verificationUrl,
}: CertificateViewProps) {
  return (
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
          {eventName && (
            <div className="certify-text">
              realizado en el marco del evento:
              <div className="event-name">{eventName}</div>
            </div>
          )}
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
          <a
            href={verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button"
          >
            Verificar certificado
          </a>
        </div>
      </div>
      <div className="print-button-container">
        <button
          className="print-button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.print()
            }
          }}
        >
          🖨️ Imprimir certificado
        </button>
      </div>
      <style jsx>{`
        ${CERTIFICATE_BASE_CSS}

        .print-button-container {
          text-align: center;
          margin-top: 24px;
        }

        .print-button {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        @media print {
          .print-button-container {
            display: none;
          }

          body {
            background: white;
          }
        }
      `}</style>
    </div>
  )
}

export default CertificateView

