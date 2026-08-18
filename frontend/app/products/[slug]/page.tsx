import type { Metadata } from 'next'
import Link from 'next/link'
import type { Product, ProductDetail, ProductVariant } from '@/lib/types'
import ImageGallery from '@/components/product/ImageGallery'
import ProductPurchasePanel from '@/components/product/ProductPurchasePanel'
import ProductTabs from '@/components/product/ProductTabs'
import ProductCard from '@/components/shop/ProductCard'

type Props = {
  params: Promise<{ slug: string }>
}

const PLACEHOLDER = 'https://placehold.co/600x600/e2e8f0/64748b'

interface ApiImage { url: string; isPrimary?: boolean }
interface ApiVariant { id?: number | string; price: number; originalPrice: number; colorName?: string; colorHex?: string; size?: string; stock?: number; sku?: string }
interface ApiCategory { name: string; slug: string }

interface ApiProduct {
  id: number | string
  name: string
  slug: string
  images?: ApiImage[]
  variants?: ApiVariant[]
  category?: ApiCategory | string
  badge?: string
  rating?: number
  reviewCount?: number
  review_count?: number
  inStock?: boolean
  in_stock?: boolean
  description?: string
  specs?: { label: string; value: string }[]
  relatedProducts?: ApiProduct[]
  related?: ApiProduct[]
}

function extractImages(p: ApiProduct): string[] {
  if (Array.isArray(p.images) && p.images.length > 0) {
    const urls = p.images.map(img => (typeof img === 'string' ? img : img.url)).filter(Boolean)
    if (urls.length > 0) return urls
  }
  return [PLACEHOLDER]
}

function mapApiToProduct(p: ApiProduct): Product {
  const variant = p.variants?.[0]
  const price = Number(variant?.price ?? 0)
  const originalPrice = Number(variant?.originalPrice ?? price)
  const cat = typeof p.category === 'object' ? p.category : null
  const image = extractImages(p)[0]

  return {
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    price,
    originalPrice,
    image,
    category: cat?.name ?? '',
    categorySlug: cat?.slug ?? '',
    badge: p.badge ?? '',
    rating: Number(p.rating ?? 0),
    reviewCount: Number(p.reviewCount ?? p.review_count ?? 0),
    inStock: p.inStock ?? p.in_stock ?? true,
  }
}

function mapApiToProductDetail(p: ApiProduct): ProductDetail {
  const images = extractImages(p)
  const variants: ProductVariant[] = (p.variants ?? []).map((v, i) => ({
    id: v.id ? Number(v.id) : i,
    price: Number(v.price ?? 0),
    originalPrice: Number(v.originalPrice ?? v.price ?? 0),
    stock: Number(v.stock ?? 0),
    colorName: v.colorName,
    colorHex: v.colorHex,
    size: v.size,
    sku: v.sku,
  }))

  return {
    ...mapApiToProduct(p),
    description: p.description ?? '',
    specs: Array.isArray(p.specs) ? p.specs : [],
    images,
    variants,
  }
}

async function fetchProductBySlug(slug: string): Promise<{
  detail: ProductDetail | null
  related: Product[]
}> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/products/${slug}`, { cache: 'no-store' })
    if (!res.ok) {
      return { detail: null, related: [] }
    }

    const json: ApiProduct = await res.json()
    const detail = mapApiToProductDetail(json)

    const relatedRaw: ApiProduct[] = Array.isArray(json.relatedProducts)
      ? json.relatedProducts
      : Array.isArray(json.related)
      ? json.related
      : []

    const related = relatedRaw.slice(0, 4).map(mapApiToProduct)

    return { detail, related }
  } catch {
    return { detail: null, related: [] }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { detail } = await fetchProductBySlug(slug)
  if (!detail) {
    return { title: 'Không tìm thấy sản phẩm' }
  }
  const ogImage = detail.images[0] || '/og-default.png'
  return {
    title: detail.name,
    description: detail.description
      ? detail.description.slice(0, 160)
      : `Mua ${detail.name} chính hãng, giá tốt tại ShopVN.`,
    openGraph: {
      title: detail.name,
      description: detail.description
        ? detail.description.slice(0, 160)
        : `Mua ${detail.name} chính hãng, giá tốt tại ShopVN.`,
      type: 'website',
      images: [{ url: ogImage, width: 800, height: 800, alt: detail.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: detail.name,
      description: detail.description
        ? detail.description.slice(0, 160)
        : `Mua ${detail.name} chính hãng.`,
      images: [ogImage],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const { detail, related: relatedProducts } = await fetchProductBySlug(slug)

  if (!detail) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-gray-800">Không tìm thấy sản phẩm</h1>
        <p className="text-gray-500">Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/shop"
          className="px-6 py-3 bg-[#3762cc] text-white rounded-xl font-semibold hover:bg-[#2a4fa3] transition-colors"
        >
          Quay lại cửa hàng
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-[#3762cc]">Trang chủ</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#3762cc]">Cửa hàng</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium line-clamp-1">{detail.name}</span>
        </nav>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left column: Image gallery (sticky on desktop) */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ImageGallery images={detail.images} name={detail.name} />
          </div>

          {/* Right column: Product info */}
          <div className="flex flex-col gap-5">
            {/* Badge */}
            {detail.badge && (
              <span className="inline-flex w-fit px-3 py-1 text-xs font-bold text-white rounded-full bg-red-500">
                {detail.badge}
              </span>
            )}

            {/* Product name */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {detail.name}
            </h1>

            {/* Rating + review count */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(detail.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-yellow-500">{detail.rating}</span>
              <span className="text-sm text-gray-400">({detail.reviewCount} đánh giá)</span>
            </div>

            {/* Price, variant selector, add-to-cart — one client component so
                switching size/color updates the price and the variant that
                actually gets added to cart, instead of always using the
                first/cheapest variant regardless of selection. */}
            <ProductPurchasePanel detail={detail} />

            {/* Short description */}
            {detail.description && (
              <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                {detail.description.slice(0, 200)}...
              </p>
            )}
          </div>
        </div>

        {/* Tabs: Description + Specs */}
        {(detail.description || detail.specs.length > 0) && (
          <ProductTabs description={detail.description} specs={detail.specs} />
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
