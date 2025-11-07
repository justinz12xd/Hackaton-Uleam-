import { Skeleton, SkeletonTable } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton variant="rectangular" height={40} width={100} className="mb-4" />
          <Skeleton variant="text" height={36} width="40%" className="mb-2" />
          <Skeleton variant="text" height={20} width="60%" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="mb-8">
          <Skeleton variant="rectangular" height={40} width="100%" />
        </div>

        {/* Table */}
        <div className="skeleton-card">
          <div className="p-6 space-y-4">
            <Skeleton variant="text" height={24} width="30%" />
            <Skeleton variant="text" height={16} width="50%" />
            <SkeletonTable rows={5} columns={6} />
          </div>
        </div>
      </div>
    </div>
  )
}

