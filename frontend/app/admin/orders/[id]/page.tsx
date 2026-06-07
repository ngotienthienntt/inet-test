'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('shopvn_token') || '' : '' }
function formatVND(n: number) { return n.toLocaleString('vi-VN') + ' ₫' }

interface OrderItem { id: number; productName: string; variantLabel?: string; price: number; quantity: number; lineTotal: number }
interface Order { id: number; orderNumber: string; fullName: string; email: string; phone: string; address: string; note?: string; subtotal: number; shipping: number; total: number; status: string; createdAt: string; items: OrderItem[] }

const STATUS_OPTIONS = [
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

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/orders/${params.id}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { setOrder(data); setNewStatus(data.status) })
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleStatusUpdate() {
    if (!newStatus || newStatus === order?.status) return
    setUpdating(true)
    try {
      const res = await fetch(`${API_URL}/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (res.ok) setOrder(prev => prev ? { ...prev, status: data.status ?? newStatus } : prev)
    } finally { setUpdating(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>
  if (!order) return <div className="p-8 text-center text-gray-400">Không tìm thấy đơn hàng</div>

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3b71]">Đơn hàng #{order.orderNumber}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_OPTIONS.find(s => s.value === order.status)?.label ?? order.status}
            </span>
            <span className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">In hoa don</button>
          <button onClick={() => router.back()} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Quay lai</button>
        </div>
      </div>

      {/* Status update */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Cập nhật trạng thái</h2>
        <div className="flex gap-3 items-center">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc]">
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={handleStatusUpdate} disabled={updating || newStatus === order.status} className="px-4 py-2 bg-[#3762cc] text-white rounded-lg text-sm font-medium hover:bg-[#2a4fa3] disabled:opacity-60 transition-colors">
            {updating ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Họ tên:</span> <span className="font-medium">{order.fullName}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="font-medium">{order.email}</span></div>
          <div><span className="text-gray-500">SĐT:</span> <span className="font-medium">{order.phone}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Địa chỉ:</span> <span className="font-medium">{order.address}</span></div>
          {order.note && <div className="col-span-2"><span className="text-gray-500">Ghi chú:</span> <span className="font-medium">{order.note}</span></div>}
        </div>
      </div>

      {/* Order items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Sản phẩm</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map(item => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{item.productName}</div>
                {item.variantLabel && <div className="text-xs text-gray-400 mt-0.5">{item.variantLabel}</div>}
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatVND(item.lineTotal)}</div>
                <div className="text-xs text-gray-400">{formatVND(item.price)} x {item.quantity}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{formatVND(order.subtotal)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Phí vận chuyển</span><span>{order.shipping === 0 ? 'Miễn phí' : formatVND(order.shipping)}</span></div>
          <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-100 pt-2"><span>Tổng cộng</span><span className="text-[#f5821f]">{formatVND(order.total)}</span></div>
        </div>
      </div>
    </div>
  )
}
