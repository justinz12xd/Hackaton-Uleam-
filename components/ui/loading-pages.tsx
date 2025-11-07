import { Skeleton } from "./skeleton"

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton variant="text" height={48} width="40%" className="mb-4" />
          <Skeleton variant="text" height={20} width="60%" />
          <div className="flex gap-4 mt-6">
            <Skeleton variant="rectangular" height={40} width={120} />
            <Skeleton variant="rectangular" height={40} width={120} />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <Skeleton variant="rectangular" height={160} width="100%" />
              <div className="p-6 space-y-3">
                <Skeleton variant="text" height={24} width="80%" />
                <Skeleton variant="text" height={16} width="90%" />
                <Skeleton variant="text" height={16} width="70%" />
                <Skeleton variant="rectangular" height={40} width="100%" className="mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton variant="text" height={32} width={200} />
          <Skeleton variant="rectangular" height={40} width={120} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="p-6 space-y-2">
                <Skeleton variant="text" height={16} width="60%" />
                <Skeleton variant="text" height={32} width="40%" />
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="skeleton-card">
          <div className="p-6 space-y-4">
            <Skeleton variant="text" height={24} width="30%" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" height={16} width="70%" />
                  <Skeleton variant="text" height={14} width="50%" />
                </div>
                <Skeleton variant="rectangular" height={32} width={80} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoadingEventDetail() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton variant="rectangular" height={24} width={120} className="mb-4" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <Skeleton variant="rectangular" height={384} width="100%" />
            
            {/* Title and Description */}
            <div className="space-y-4">
              <Skeleton variant="text" height={36} width="80%" />
              <Skeleton variant="text" height={20} width="40%" />
              <div className="space-y-2">
                <Skeleton variant="text" height={16} width="100%" />
                <Skeleton variant="text" height={16} width="95%" />
                <Skeleton variant="text" height={16} width="90%" />
              </div>
            </div>

            {/* Details Card */}
            <div className="skeleton-card">
              <div className="p-6 space-y-4">
                <Skeleton variant="text" height={24} width="40%" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton variant="rectangular" width={20} height={20} />
                    <Skeleton variant="text" height={16} width="60%" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="skeleton-card">
              <div className="p-6 space-y-4">
                <Skeleton variant="text" height={20} width="70%" />
                <Skeleton variant="rectangular" height={48} width="100%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
