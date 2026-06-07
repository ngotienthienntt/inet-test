'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('shopvn_token') || '' : '' }

interface Stats {
  totalUsers: number
  totalOrders: number
  totalProducts: number
  totalGuests: number
  totalRevenue: number
  recentOrders: RecentOrder[]
}

interface RecentOrder {
  id: number
  orderNumber: string
  fullName: string
  email: string
  total: number
  status: string
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

function StatCard({ label, value, icon, color, loading }: { label: string; value: string; icon: string; color: string; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${color}`}>{icon}</span>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {loading ? <span className="inline-block w-20 h-7 bg-gray-100 rounded animate-pulse" /> : value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c3b71]">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động cửa hàng</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Tổng doanh thu"  value={stats ? formatVND(stats.totalRevenue) : '0 ₫'} icon="💰" color="bg-green-50"  loading={loading} />
        <StatCard label="Tổng đơn hàng"  value={stats ? String(stats.totalOrders)   : '0'}    icon="🛒" color="bg-blue-50"   loading={loading} />
        <StatCard label="Tổng sản phẩm"  value={stats ? String(stats.totalProducts) : '0'}    icon="📦" color="bg-purple-50" loading={loading} />
        <StatCard label="Khách hàng"      value={stats ? String(stats.totalUsers)    : '0'}    icon="👥" color="bg-orange-50" loading={loading} />
        <StatCard label="Khách vãng lai"  value={stats ? String(stats.totalGuests)   : '0'}    icon="🚶" color="bg-gray-50"   loading={loading} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-medium hover:bg-[#2a4fa3] transition-colors">
          <span>+</span> Thêm sản phẩm
        </Link>
        <Link href="/admin/orders" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Xem đơn hàng
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Đơn hàng gần đây</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : !stats || stats.recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chưa có đơn hàng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
                  <th className="px-6 py-3 font-medium">Đơn hàng</th>
                  <th className="px-6 py-3 font-medium">Khách hàng</th>
                  <th className="px-6 py-3 font-medium">Tổng tiền</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium">Ngày</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-[#3762cc]">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.fullName}</div>
                      <div className="text-xs text-gray-400">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{formatVND(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-[#3762cc] hover:underline text-xs">Xem</Link>
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
