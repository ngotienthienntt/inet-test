import { SlidersHorizontalWrapper } from '@/components/shop/SlidersWrapper'
import PromoBanner from '@/components/home/PromoBanner'
import type { Tag } from '@/lib/types'

interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  isActive: boolean
  children?: { id: number; name: string; slug: string }[]
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/categories`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    const list: Category[] = Array.isArray(data) ? data : data.data ?? []
    return list.filter(c => c.isActive !== false && !('parentId' in c && (c as any).parentId))
  } catch {
    return []
  }
}

async function fetchTags(): Promise<Tag[]> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/tags`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, tags] = await Promise.all([fetchCategories(), fetchTags()])

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
      <PromoBanner position="shop_top" />
      <SlidersHorizontalWrapper categories={categories} tags={tags}>
        {children}
      </SlidersHorizontalWrapper>
    </div>
  )
}
