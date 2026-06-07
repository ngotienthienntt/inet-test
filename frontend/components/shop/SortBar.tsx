'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'

const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
]

export default function SortBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') ?? ''

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('sort', e.target.value)
    } else {
      params.delete('sort')
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      {/* Left: count */}
      <div />

      {/* Right: view toggle + sort */}
      <div className="flex items-center gap-3">
        {/* View toggle — UI only, no list view needed yet */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Dạng lưới"
            className="p-1.5 rounded-md bg-[#3762cc] text-white"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Dạng danh sách"
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Sort dropdown */}
        <select
          value={currentSort}
          onChange={handleSortChange}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#3762cc]/30 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
