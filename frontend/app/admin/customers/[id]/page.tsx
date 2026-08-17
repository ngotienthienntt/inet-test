'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/adminFetch'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Customer {
  id: number
  fullName: string
  email: string
  phone?: string
  isActive: boolean
  createdAt: string
  role: string
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    adminFetch(`${API_URL}/admin/customers/${params.id}`)
      .then(r => r.json())
      .then(setCustomer)
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleToggleBan() {
    if (!customer) return
    const action = customer.isActive ? 'khóa' : 'mở khóa'
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return
    setToggling(true)
    try {
      const res = await adminFetch(`${API_URL}/admin/customers/${params.id}/toggle-ban`, {
        method: 'PATCH',
      })
      const data = await res.json()
      if (res.ok) setCustomer(prev => prev ? { ...prev, isActive: data.isActive } : prev)
    } finally { setToggling(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>
  if (!customer) return <div className="p-8 text-center text-gray-400">Không tìm thấy khách hàng</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c3b71]">{customer.fullName}</h1>
          <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {customer.isActive ? 'Hoạt động' : 'Đã khóa'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleBan}
            disabled={toggling}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              customer.isActive
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
            }`}
          >
            {toggling ? '...' : customer.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
          </button>
          <button onClick={() => router.back()} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Quay lại
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Thông tin tài khoản</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 mb-0.5">Họ tên</dt>
            <dd className="font-medium text-gray-900">{customer.fullName}</dd>
          </div>
          <div>
            <dt className="text-gray-500 mb-0.5">Email</dt>
            <dd className="font-medium text-gray-900">{customer.email}</dd>
          </div>
          {customer.phone && (
            <div>
              <dt className="text-gray-500 mb-0.5">Số điện thoại</dt>
              <dd className="font-medium text-gray-900">{customer.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500 mb-0.5">Ngày đăng ký</dt>
            <dd className="font-medium text-gray-900">{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</dd>
          </div>
          <div>
            <dt className="text-gray-500 mb-0.5">Vai trò</dt>
            <dd className="font-medium text-gray-900 capitalize">{customer.role}</dd>
          </div>
          <div>
            <dt className="text-gray-500 mb-0.5">Mã khách hàng</dt>
            <dd className="font-mono text-gray-900">#{customer.id}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
