'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const PAGE_SIZE = 10

interface Product {
  id: number
  name: string
  slug: string
  price: number
  category: string
  inStock: boolean
  isActive: boolean
  images: string[]
}

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('shopvn_token') || ''
}

function formatVND(n: number) { return n.toLocaleString('vi-VN') + ' ₫' }

function mapProduct(item: unknown): Product {
  const p = item as Record<string, unknown>
  const variant = (Array.isArray(p.variants) ? p.variants[0] : undefined) as Record<string, unknown> | undefined
  const cat = p.category as Record<string, unknown> | string | undefined
  const images = Array.isArray(p.images)
    ? (p.images as Record<string, unknown>[]).map(img => typeof img === 'string' ? img : String(img.url ?? ''))
    : []
  return {
    id: Number(p.id),
    name: String(p.name ?? ''),
    slug: String(p.slug ?? ''),
    price: Number(variant?.price ?? p.price ?? 0),
    category: typeof cat === 'object' && cat !== null ? String(cat.name ?? '') : String(cat ?? ''),
    inStock: Boolean(p.inStock ?? p.in_stock ?? true),
    isActive: Boolean(p.isActive ?? p.is_active ?? true),
    images,
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null)
  const { toasts, toast, close } = useToast()

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), all: 'true' })
    if (search) params.set('q', search)
    fetch(`${API_URL}/products?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => {
        const arr: unknown[] = Array.isArray(data) ? data : data?.data ?? data?.products ?? []
        const count: number = data?.total ?? arr.length
        setProducts(arr.map(mapProduct))
        setTotal(count)
      })
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  async function doDelete(id: number, name: string) {
    const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.message || 'Không thể xóa sản phẩm', 'error')
      return
    }
    toast(`Đã xóa sản phẩm "${name}"`, 'success')
    if (products.length === 1 && page > 1) setPage(p => p - 1)
    else load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3b71]">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">{total} sản phẩm</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-semibold hover:bg-[#2a4fa3] transition-colors">
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
            />
            <button type="submit" className="px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-medium hover:bg-[#2a4fa3] transition-colors">
              Tìm
            </button>
            {search && (
              <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Xóa
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có sản phẩm nào</div>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full min-w-[900px] text-sm table-fixed">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50 sticky top-0 z-10">
                  <th className="px-4 py-3 font-medium w-14">STT</th>
                  <th className="px-4 py-3 font-medium w-64">Sản phẩm</th>
                  <th className="px-4 py-3 font-medium w-36">Danh mục</th>
                  <th className="px-4 py-3 font-medium w-32">Giá</th>
                  <th className="px-4 py-3 font-medium w-28">Kho</th>
                  <th className="px-4 py-3 font-medium w-28">Trạng thái</th>
                  <th className="px-4 py-3 font-medium w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-gray-400 text-sm">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 truncate max-w-[160px]">{p.name}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 truncate">{p.category || '—'}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">{formatVND(p.price)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.inStock ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/${p.id}/edit`} className="text-[#3762cc] hover:underline text-xs">Sửa</Link>
                        <span className="text-gray-200">|</span>
                        <button onClick={() => setConfirm({ id: p.id, name: p.name })} className="text-red-500 hover:underline text-xs">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Trang {page}/{totalPages} &middot; {total} sản phẩm
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                «
              </button>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-gray-400">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        page === n
                          ? 'bg-[#3762cc] border-[#3762cc] text-white font-semibold'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2 py-1 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={close} />
      <ConfirmDialog
        open={confirm !== null}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn xóa sản phẩm "${confirm?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={() => { if (confirm) { doDelete(confirm.id, confirm.name); setConfirm(null) } }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
