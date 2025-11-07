export const CERTIFICATE_BASE_CSS = `
  .certificate-wrapper {
    width: 100%;
  }

  .certificate-container {
    max-width: 720px;
    margin: 0 auto;
    background: #fdfdfd;
    border-radius: 24px;
    border: 2px solid #dde1f3;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    padding: 48px 56px;
    position: relative;
    overflow: hidden;
  }

  .certificate-container::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    border: 1px dashed rgba(99, 102, 241, 0.25);
    margin: 16px;
    pointer-events: none;
  }

  .certificate-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .certificate-title {
    font-size: 42px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0;
  }

  .certificate-subtitle {
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 0.4em;
    color: #4b5563;
    margin-top: 8px;
  }

  .certificate-body {
    text-align: center;
    margin: 40px 0;
  }

  .certify-text {
    font-size: 16px;
    color: #4b5563;
    margin: 12px 0;
  }

  .participant-name {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin: 16px 0;
  }

  .course-name {
    font-size: 24px;
    font-weight: 600;
    color: #1d4ed8;
    margin: 12px 0;
  }

  .event-name {
    font-size: 18px;
    font-weight: 500;
    color: #2563eb;
    margin-top: 8px;
  }

  .date-section {
    font-size: 14px;
    color: #4b5563;
    margin-top: 24px;
  }

  .certificate-footer {
    margin-top: 48px;
    display: flex;
    justify-content: center;
  }

  .signature-block {
    text-align: center;
  }

  .signature-line {
    width: 220px;
    border-bottom: 2px solid rgba(17, 24, 39, 0.2);
    margin: 0 auto 12px;
  }

  .signature-name {
    font-size: 16px;
    font-weight: 600;
  }

  .signature-title {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #6b7280;
    margin-top: 4px;
  }

  .qr-section {
    margin-top: 32px;
    text-align: center;
  }

  .qr-code {
    width: 160px;
    height: 160px;
    margin: 0 auto;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    padding: 12px;
    background: white;
  }

  .certificate-number {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6b7280;
    margin-top: 16px;
  }
`


