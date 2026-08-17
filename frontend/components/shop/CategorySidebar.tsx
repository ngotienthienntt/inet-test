'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Tag } from '@/lib/types'

const PRICE_RANGES = [
  { label: 'Dưới 5 triệu', minPrice: 0, maxPrice: 5000000 },
  { label: '5 - 10 triệu', minPrice: 5000000, maxPrice: 10000000 },
  { label: '10 - 20 triệu', minPrice: 10000000, maxPrice: 20000000 },
  { label: 'Trên 20 triệu', minPrice: 20000000, maxPrice: 0 },
]

interface CategoryChild {
  id: number
  name: string
  slug: string
}

interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  children?: CategoryChild[]
}

function CategorySidebarInner({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const activeCategory = searchParams.get('category')
  const activeMinPrice = searchParams.get('minPrice')
  const activeTag = searchParams.get('tag')

  const [expandedIds, setExpandedIds] = useState<number[]>(() => {
    if (!activeCategory) return []
    const parent = categories.find(cat =>
      cat.children?.some(child => child.slug === activeCategory)
    )
    return parent ? [parent.id] : []
  })

  function toggleExpand(id: number) {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function isPriceActive(minPrice: number, maxPrice: number) {
    return (
      searchParams.get('minPrice') === String(minPrice) &&
      searchParams.get('maxPrice') === String(maxPrice)
    )
  }

  const isShopRoot = pathname === '/shop' && !activeCategory && !activeMinPrice

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="mb-2">
        <Link
          href="/shop"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isShopRoot ? 'bg-blue-50 text-[#3762cc] font-semibold' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tất cả sản phẩm
        </Link>
      </div>

      <div className="border-t border-gray-100 my-3" />

      <nav className="space-y-1">
        {categories.map(category => {
          const isExpanded = expandedIds.includes(category.id)
          const isParentActive = !!activeCategory && category.children?.some(c => c.slug === activeCategory)
          const isTopActive = activeCategory === category.slug || isParentActive

          return (
            <div key={category.id}>
              <div className={`flex items-center rounded-lg text-sm transition-colors ${
                isTopActive ? 'bg-blue-50 text-[#3762cc] font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="flex-1 flex items-center gap-2 px-3 py-2"
                >
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                </Link>
                {category.children && category.children.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(category.id)}
                    className="px-2 py-2"
                    aria-label="Mở rộng"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {isExpanded && category.children && category.children.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {category.children.map(child => {
                    const isChildActive = activeCategory === child.slug
                    return (
                      <li key={child.id}>
                        <Link
                          href={`/shop?category=${child.slug}`}
                          className={`block pl-8 pr-3 py-1.5 rounded-lg text-sm transition-colors ${
                            isChildActive
                              ? 'text-[#3762cc] font-medium bg-blue-50'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 my-4" />

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">Lọc theo giá</h3>
        <div className="space-y-1.5">
          {PRICE_RANGES.map(range => {
            const active = isPriceActive(range.minPrice, range.maxPrice)
            const href = range.maxPrice === 0
              ? `/shop?minPrice=${range.minPrice}`
              : `/shop?minPrice=${range.minPrice}&maxPrice=${range.maxPrice}`
            return (
              <Link
                key={range.label}
                href={href}
                className={`block px-3 py-2 rounded-lg text-sm text-center transition-colors ${
                  active ? 'bg-[#3762cc] text-white font-medium' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range.label}
              </Link>
            )
          })}
        </div>
      </div>

      {tags.length > 0 && (
        <>
          <div className="border-t border-gray-100 my-4" />
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">Lọc theo đối tượng sử dụng</h3>
            <div className="space-y-1.5">
              {tags.map(tag => {
                const active = activeTag === tag.slug
                const params = new URLSearchParams(searchParams.toString())
                if (active) params.delete('tag'); else params.set('tag', tag.slug)
                return (
                  <Link
                    key={tag.slug}
                    href={`/shop?${params.toString()}`}
                    className={`block px-3 py-2 rounded-lg text-sm text-center transition-colors ${
                      active ? 'bg-[#3762cc] text-white font-medium' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tag.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function CategorySidebar({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded mb-2" />
          ))}
        </div>
      }
    >
      <CategorySidebarInner categories={categories} tags={tags} />
    </Suspense>
  )
}
