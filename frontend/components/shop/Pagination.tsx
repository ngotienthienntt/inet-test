'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    return `?${params.toString()}`
  }

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-6">
      <Link
        href={buildHref(currentPage - 1)}
        aria-disabled={currentPage === 1}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPage === 1
            ? 'text-gray-300 pointer-events-none'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        ← Trước
      </Link>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-3 py-2 text-gray-400 text-sm">…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              p === currentPage
                ? 'bg-[#3762cc] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={buildHref(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPage === totalPages
            ? 'text-gray-300 pointer-events-none'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        Tiếp →
      </Link>
    </div>
  )
}
