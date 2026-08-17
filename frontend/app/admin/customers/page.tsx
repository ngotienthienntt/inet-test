'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/adminFetch'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Customer {
  id: number
  fullName: string
  email: string
  phone?: string
  isActive: boolean
  createdAt: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  function load(p = 1, q = search) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (q) params.set('search', q)
    adminFetch(`${API_URL}/admin/customers?${params}`)
      .then(r => r.json())
      .then(data => {
        setCustomers(data.data ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1, '') }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(1, search)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c3b71]">Khach hang</h1>
        <p className="text-sm text-gray-500 mt-1">{total} khach hang</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Tim kiem ten, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]"
            />
            <button type="submit" className="px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-medium hover:bg-[#2a4fa3]">
              Tim
            </button>
          </form>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Dang tai...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Khong co khach hang nao</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
                    <th className="px-6 py-3 font-medium">Ho ten</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Ngay tao</th>
                    <th className="px-6 py-3 font-medium">Trang thai</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{c.fullName}</div>
                        {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.email}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.isActive ? 'Hoat dong' : 'Da khoa'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/customers/${c.id}`} className="text-[#3762cc] hover:underline text-xs">
                          Xem chi tiet
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Trang {page} / {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => { const p = page - 1; setPage(p); load(p) }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Truoc
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => { const p = page + 1; setPage(p); load(p) }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
