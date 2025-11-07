import CertificatePublicPage from "@/app/certificates/[certificateNumber]/page"

interface LocalizedParams {
  locale: string
  certificateNumber: string
}

export default async function LocalizedCertificatePage({
  params,
}: {
  params: Promise<LocalizedParams>
}) {
  const { certificateNumber } = await params

  return CertificatePublicPage({
    params: Promise.resolve({ certificateNumber }),
  })
}

