import Image from 'next/image'
import Link from 'next/link'
import HomeProductActions from './HomeProductActions'

interface Variant {
  id?: number
  price: number
  originalPrice: number
}

interface Product {
  id: number
  name: string
  slug: string
  badge?: string
  images?: { url: string; isPrimary?: boolean }[]
  variants?: Variant[]
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/products?limit=8&featured=true&sort=newest`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : data.data ?? []
  } catch {
    return []
  }
}

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

function getBadgeClass(badge: string): string {
  switch (badge) {
    case 'HOT': return 'bg-red-500'
    case 'SALE': return 'bg-[#f5821f]'
    case 'MỚI': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

function getImage(product: Product): string {
  const primary = product.images?.find(i => i.isPrimary) ?? product.images?.[0]
  return primary?.url ?? 'https://placehold.co/300x300/e2e8f0/64748b'
}

// Multiple variants can carry different prices (size, color, ...) — listings
// show the cheapest one, matching common "from ₫X" e-commerce convention.
function getPrice(product: Product): { price: number; originalPrice: number; variantId: number | undefined } {
  const v = product.variants?.reduce((min, c) => (c.price < min.price ? c : min), product.variants[0])
  return { price: v?.price ?? 0, originalPrice: v?.originalPrice ?? 0, variantId: v?.id }
}

export default async function FeaturedProducts() {
  const products = await fetchFeaturedProducts()

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-[#1c3b71]">Sản phẩm nổi bật</h2>
        <Link href="/shop" className="text-sm font-medium text-[#3762cc] hover:text-[#2a4fa3] transition-colors">
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const { price, originalPrice, variantId } = getPrice(product)
          const cartProduct = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price,
            originalPrice,
            image: getImage(product),
            category: '',
            categorySlug: '',
            badge: product.badge ?? '',
            rating: 0,
            reviewCount: 0,
            inStock: true,
          }

          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col">
              <Link href={`/products/${product.slug}`} className="flex flex-col flex-1">
                <div className="relative">
                  <Image
                    src={getImage(product)}
                    alt={product.name}
                    width={300}
                    height={300}
                    unoptimized
                    className="w-full h-48 object-cover"
                  />
                  {product.badge && (
                    <span className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded ${getBadgeClass(product.badge)}`}>
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 flex-1">
                    {product.name}
                  </p>
                  <div className="mb-3">
                    <p className="text-base font-bold text-[#f5821f]">{formatVND(price)}</p>
                    {originalPrice > price && (
                      <p className="text-xs text-gray-400 line-through">{formatVND(originalPrice)}</p>
                    )}
                  </div>
                </div>
              </Link>
              <div className="px-3 pb-3">
                <HomeProductActions product={cartProduct} variantId={variantId} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
