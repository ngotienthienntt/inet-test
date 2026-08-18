import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  isActive: boolean
  parentId?: number | null
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/categories`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    const list: Category[] = Array.isArray(data) ? data : data.data ?? []
    return list.filter(c => c.isActive !== false && !c.parentId).slice(0, 8)
  } catch {
    return []
  }
}

export default async function CategoryGrid() {
  const categories = await fetchCategories()

  return (
    <section>
      <h2 className="text-xl font-bold text-[#1c3b71] mb-4">Danh mục sản phẩm</h2>
      <div className="flex flex-wrap justify-center gap-3 pb-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className="flex-shrink-0 flex flex-col items-center gap-2 px-5 py-4 bg-white rounded-xl border border-gray-200 hover:border-[#3762cc] hover:shadow-md transition-all min-w-[100px] group"
          >
            {category.icon && (
              <Image src={category.icon} alt={category.name} width={32} height={32} unoptimized className="w-8 h-8 object-contain" />
            )}
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#3762cc] transition-colors text-center whitespace-nowrap">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
