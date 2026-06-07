export default function ShopLoading() {
  return (
    <div className="py-6 space-y-4 animate-pulse">
      {/* Page title */}
      <div className="h-8 w-56 bg-gray-200 rounded" />
      {/* Sort bar */}
      <div className="h-10 bg-gray-100 rounded" />
      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-square bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
