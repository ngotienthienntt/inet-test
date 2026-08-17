import type { Metadata } from 'next'
import ProductGrid from '@/components/shop/ProductGrid'
import SortBar from '@/components/shop/SortBar'
import Pagination from '@/components/shop/Pagination'
import { Suspense } from 'react'
import { type Product } from '@/lib/types'

const PAGE_SIZE = 20

interface ShopPageProps {
  searchParams: Promise<{
    category?: string
    tag?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    q?: string
    page?: string
  }>
}

interface ApiProductImage {
  url: string
  isPrimary?: boolean
}

interface ApiVariant {
  id?: number | string
  price: number
  originalPrice: number
}

interface ApiProduct {
  id: number | string
  name: string
  slug: string
  images?: ApiProductImage[]
  variants?: ApiVariant[]
  category?: { name: string; slug: string } | string
  badge?: string
  rating?: number
  reviewCount?: number
  review_count?: number
  inStock?: boolean
  in_stock?: boolean
  tags?: { id: number; name: string; slug: string }[]
}

const PLACEHOLDER = 'https://placehold.co/300x300/e2e8f0/64748b'

function mapProduct(p: ApiProduct): Product {
  const primaryImage = p.images?.find(i => i.isPrimary)?.url ?? p.images?.[0]?.url ?? PLACEHOLDER
  const variant = p.variants?.[0]
  const price = Number(variant?.price ?? 0)
  const originalPrice = Number(variant?.originalPrice ?? price)
  const cat = typeof p.category === 'object' ? p.category : null

  return {
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    price,
    originalPrice,
    image: primaryImage,
    category: cat?.name ?? '',
    categorySlug: cat?.slug ?? '',
    badge: p.badge ?? '',
    rating: Number(p.rating ?? 0),
    reviewCount: Number(p.reviewCount ?? p.review_count ?? 0),
    inStock: p.inStock ?? p.in_stock ?? true,
    variantId: p.variants?.[0]?.id ? Number(p.variants[0].id) : undefined,
    tags: p.tags ?? [],
  }
}

async function getCategoryName(slug: string): Promise<string> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/categories/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return 'Sản phẩm'
    const data = await res.json()
    return data.name ?? 'Sản phẩm'
  } catch {
    return 'Sản phẩm'
  }
}

async function getPageTitle(category?: string, q?: string): Promise<string> {
  if (q) return `Kết quả tìm kiếm: "${q}"`
  if (category) return getCategoryName(category)
  return 'Tất cả sản phẩm'
}

async function fetchProducts(params: {
  category?: string
  tag?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  q?: string
  page?: string
}): Promise<{ products: Product[]; total: number; totalPages: number }> {
  try {
    const page = Math.max(1, parseInt(params.page ?? '1') || 1)
    const query = new URLSearchParams()
    if (params.category) query.set('category', params.category)
    if (params.tag) query.set('tag', params.tag)
    if (params.minPrice) query.set('minPrice', params.minPrice)
    if (params.maxPrice) query.set('maxPrice', params.maxPrice)
    if (params.sort) query.set('sort', params.sort)
    if (params.q) query.set('q', params.q)
    query.set('page', String(page))
    query.set('limit', String(PAGE_SIZE))

    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/products?${query.toString()}`, { cache: 'no-store' })
    if (!res.ok) return { products: [], total: 0, totalPages: 0 }

    const json = await res.json()
    const raw: ApiProduct[] = Array.isArray(json) ? json : json?.data ?? []
    const total: number = json?.total ?? raw.length
    const totalPages: number = json?.totalPages ?? Math.ceil(total / PAGE_SIZE)

    return { products: raw.map(mapProduct), total, totalPages }
  } catch {
    return { products: [], total: 0, totalPages: 0 }
  }
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams
  const title = await getPageTitle(params.category, params.q)
  return {
    title,
    description: `Mua ${title.toLowerCase()} chính hãng, giá tốt tại ShopVN.`,
    openGraph: {
      title,
      description: `Mua ${title.toLowerCase()} chính hãng, giá tốt tại ShopVN.`,
      type: 'website',
    },
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1') || 1)
  const [{ products, total, totalPages }, title] = await Promise.all([
    fetchProducts(params),
    getPageTitle(params.category, params.q),
  ])

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#1c3b71]">{title}</h1>
      <Suspense>
        <SortBar />
      </Suspense>
      <ProductGrid products={products} />
      <Suspense>
        <Pagination currentPage={page} totalPages={totalPages} />
      </Suspense>
    </div>
  )
}
