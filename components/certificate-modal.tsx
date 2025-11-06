"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Award, Share2, Download } from "lucide-react"

interface CertificateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseTitle: string
  certificateNumber: string
  issuedDate: string
}

export function CertificateModal({
  open,
  onOpenChange,
  courseTitle,
  certificateNumber,
  issuedDate,
}: CertificateModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Certificate Earned</DialogTitle>
          <DialogDescription>Congratulations on completing the course!</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Certificate Visual */}
          <div className="border-2 border-primary rounded-lg p-8 text-center space-y-4 bg-card">
            <Award className="w-16 h-16 text-primary mx-auto" />
            <div>
              <h3 className="font-bold text-lg">Certificate of Completion</h3>
              <p className="text-sm text-muted-foreground mt-2">{courseTitle}</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-1">Certificate Number</p>
              <p className="font-mono text-xs font-semibold">{certificateNumber}</p>
            </div>
            <p className="text-xs text-muted-foreground">Issued: {new Date(issuedDate).toLocaleDateString()}</p>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">Scan to verify</p>
            <div className="w-24 h-24 bg-muted rounded mx-auto" />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 bg-transparent"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
            <Button variant="outline" className="flex-1 gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
