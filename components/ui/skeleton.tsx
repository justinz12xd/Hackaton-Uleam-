import { cn } from '@/lib/utils'
import './skeleton.css'

interface SkeletonProps extends React.ComponentProps<'div'> {
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
  animation?: "pulse" | "wave" | "none"
}

function Skeleton({ 
  className, 
  variant = "rectangular",
  width,
  height,
  animation = "wave",
  ...props 
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        'skeleton',
        `skeleton-${variant}`,
        `skeleton-${animation}`,
        className
      )}
      style={style}
      {...props}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton variant="rectangular" height={160} className="skeleton-card-image" />
      <div className="skeleton-card-content">
        <Skeleton variant="text" height={24} width="80%" />
        <Skeleton variant="text" height={16} width="60%" className="mt-2" />
        <Skeleton variant="text" height={16} width="90%" className="mt-1" />
        <div className="skeleton-card-footer">
          <Skeleton variant="text" height={14} width="40%" />
          <Skeleton variant="text" height={14} width="30%" />
        </div>
        <Skeleton variant="rectangular" height={40} className="skeleton-card-button" />
      </div>
    </div>
  )
}

function SkeletonEventCard() {
  return (
    <div className="skeleton-event-card">
      <Skeleton variant="rectangular" width={128} height={128} className="skeleton-event-image" />
      <div className="skeleton-event-content">
        <div className="skeleton-event-header">
          <Skeleton variant="text" height={20} width="150px" />
          <Skeleton variant="rectangular" height={24} width={80} />
        </div>
        <Skeleton variant="text" height={28} width="70%" className="skeleton-event-title" />
        <Skeleton variant="text" height={16} width="90%" />
        <Skeleton variant="text" height={16} width="80%" className="mt-1" />
        <div className="skeleton-event-meta">
          <Skeleton variant="text" height={16} width={100} />
          <Skeleton variant="text" height={16} width={120} />
          <Skeleton variant="text" height={16} width={90} />
        </div>
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" height={20} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <Skeleton variant="circular" width={80} height={80} className="skeleton-profile-avatar" />
      <Skeleton variant="text" height={28} width={200} className="skeleton-profile-name" />
      <Skeleton variant="text" height={16} width={150} className="skeleton-profile-email" />
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonEventCard, SkeletonTable, SkeletonProfile }
