export default function ProductDetailLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        {/* Breadcrumb */}
        <div className="flex gap-2 mb-6">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
          {/* Right: Product info */}
          <div className="flex flex-col gap-5">
            <div className="h-6 w-20 bg-red-100 rounded-full" />
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="h-10 w-48 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-10 space-y-4">
          <div className="flex gap-4 border-b border-gray-200 pb-2">
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="h-8 w-32 bg-gray-100 rounded" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
