'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/adminFetch'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
function formatVND(n: number) { return n.toLocaleString('vi-VN') + ' ₫' }

interface Order {
  id: number
  orderNumber: string
  fullName: string
  email: string
  total: number
  status: string
  createdAt: string
  items?: { id: number }[]
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Use admin stats endpoint to get all orders, or fallback to a general endpoint
    adminFetch(`${API_URL}/admin/stats`)
      .then(r => r.json())
      .then(data => {
        // stats returns recentOrders (last 10). For full list, fetch separately
        setOrders(data.recentOrders ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders
    .filter(o => !statusFilter || o.status === statusFilter)
    .filter(o => !search || o.orderNumber.includes(search) || o.fullName.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c3b71]">Đơn hàng</h1>
        <p className="text-sm text-gray-500 mt-1">{orders.length} đơn hàng gần đây</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng, khách hàng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc] w-full sm:w-auto sm:flex-1 max-w-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${statusFilter === s.value ? 'bg-[#3762cc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có đơn hàng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
                  <th className="px-6 py-3 font-medium">Đơn hàng</th>
                  <th className="px-6 py-3 font-medium">Khách hàng</th>
                  <th className="px-6 py-3 font-medium">Sản phẩm</th>
                  <th className="px-6 py-3 font-medium">Tổng tiền</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium">Ngày</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-[#3762cc]">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.fullName}</div>
                      <div className="text-xs text-gray-400">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.items?.length ?? '—'} SP</td>
                    <td className="px-6 py-4 font-semibold">{formatVND(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_OPTIONS.find(s => s.value === order.status)?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-[#3762cc] hover:underline text-xs">Xem chi tiết</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
