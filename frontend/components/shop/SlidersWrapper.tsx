'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import CategorySidebar from './CategorySidebar'
import type { Tag } from '@/lib/types'

interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  children?: { id: number; name: string; slug: string }[]
}

export function SlidersHorizontalWrapper({
  categories,
  tags,
  children,
}: {
  categories: Category[]
  tags: Tag[]
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Bộ lọc
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white overflow-y-auto z-50 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-semibold text-gray-800">Bộ lọc</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <CategorySidebar categories={categories} tags={tags} />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 items-start">
        <aside className="hidden lg:block w-64 shrink-0">
          <CategorySidebar categories={categories} tags={tags} />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  )
}
