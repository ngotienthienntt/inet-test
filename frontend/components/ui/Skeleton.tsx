export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Image placeholder */}
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        {/* Title line */}
        <Skeleton className="h-4 w-3/4" />
        {/* Subtitle line */}
        <Skeleton className="h-3 w-1/2" />
        {/* Price line */}
        <Skeleton className="h-4 w-1/3" />
        {/* Button */}
        <Skeleton className="h-9 w-full mt-1" />
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
      {/* Header line */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-20" />
      </div>
      {/* Content line 1 */}
      <Skeleton className="h-3 w-2/3" />
      {/* Content line 2 */}
      <Skeleton className="h-3 w-1/2" />
      {/* Footer line */}
      <div className="flex justify-between items-center pt-1 border-t border-gray-100">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}
