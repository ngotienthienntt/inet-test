'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, MessageCircle } from 'lucide-react'
import { ordersApi } from '@/lib/api'
import { getToken, getSessionToken } from '@/lib/auth'

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem {
  productId: number | string
  name: string
  image: string
  price: number
  quantity: number
  variant?: string
}

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  contactName: string
  contactEmail: string
  contactPhone: string
  address: string
}

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN')
}

function formatDateTime(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('vi-VN')
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const TIMELINE_STEP_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']
const TIMELINE_STEP_LABELS: Record<string, string> = {
  pending: 'Đặt hàng',
  processing: 'Xác nhận',
  shipped: 'Đang giao',
  delivered: 'Đã nhận hàng',
}

const PLACEHOLDER = 'https://placehold.co/300x300/e2e8f0/64748b'

function mapOrder(raw: Record<string, unknown>): Order {
  const items: OrderItem[] = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[]).map((item) => ({
        productId: (item.id ?? 0) as number | string,
        name: String(item.productName ?? item.name ?? ''),
        image: PLACEHOLDER,
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        variant: (item.variantLabel ?? item.variant) as string | undefined,
      }))
    : []

  return {
    id: String(raw.id ?? ''),
    orderNumber: String(raw.orderNumber ?? raw.order_number ?? raw.id ?? ''),
    status: (raw.status as OrderStatus) ?? 'pending',
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
    items,
    subtotal: Number(raw.subtotal ?? 0),
    shipping: Number(raw.shipping ?? 0),
    total: Number(raw.total ?? 0),
    contactName: String(raw.fullName ?? raw.contactName ?? raw.full_name ?? ''),
    contactEmail: String(raw.email ?? raw.contactEmail ?? ''),
    contactPhone: String(raw.phone ?? raw.contactPhone ?? ''),
    address: String(raw.address ?? ''),
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const jwt = getToken()
    const session = jwt ? undefined : getSessionToken() ?? undefined

    ordersApi
      .getById(id, session)
      .then((res) => {
        setOrder(mapOrder(res.data as Record<string, unknown>))
      })
      .catch((err) => {
        if (err?.response?.status === 404 || err?.response?.status === 401) {
          setNotFound(true)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Đang tải đơn hàng...</p>
      </main>
    )
  }

  if (notFound || !order) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-gray-800">Không tìm thấy đơn hàng</h1>
        <p className="text-gray-500">Đơn hàng không tồn tại hoặc bạn không có quyền xem.</p>
        <Link
          href="/orders"
          className="px-6 py-3 bg-[#3762cc] text-white rounded-xl font-semibold hover:bg-[#2a4fa3] transition-colors"
        >
          Quay lại đơn hàng
        </Link>
      </main>
    )
  }

  const isCancelled = order.status === 'cancelled'
  const currentStepIndex = isCancelled ? -1 : TIMELINE_STEP_STATUSES.indexOf(order.status)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/orders" className="hover:text-[#3762cc]">
            Đơn hàng
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">#{order.orderNumber}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---- Left column (2/3) ---- */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-6">Trạng thái đơn hàng</h2>

              {isCancelled ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 text-lg font-bold">✕</span>
                  </div>
                  <p className="font-semibold text-red-700">Đơn hàng đã bị huỷ</p>
                </div>
              ) : (
                <ol className="relative">
                  {TIMELINE_STEP_STATUSES.map((stepStatus, index) => {
                    const isCompleted = index < currentStepIndex
                    const isCurrent = index === currentStepIndex
                    const isLast = index === TIMELINE_STEP_STATUSES.length - 1

                    return (
                      <li key={stepStatus} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          {isCompleted ? (
                            <div className="w-8 h-8 rounded-full bg-[#3762cc] flex items-center justify-center flex-shrink-0 z-10">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-8 h-8 rounded-full border-2 border-[#3762cc] flex items-center justify-center flex-shrink-0 z-10 relative">
                              <span className="absolute inset-1 rounded-full bg-[#3762cc] animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 z-10">
                              <span className="w-3 h-3 rounded-full bg-gray-400" />
                            </div>
                          )}
                          {!isLast && (
                            <div
                              className={`w-0.5 flex-1 min-h-8 mt-1 mb-1 ${
                                isCompleted ? 'bg-[#3762cc]' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>

                        <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
                          <p
                            className={`font-semibold text-sm ${
                              isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                            }`}
                          >
                            {TIMELINE_STEP_LABELS[stepStatus]}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDateTime(order.updatedAt)}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>

            {/* Order items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Sản phẩm đã đặt</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex items-center gap-4 px-6 py-4">
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-600">x{item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {formatVND(item.price)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 w-28">
                      <p className="text-xs text-gray-400">Thành tiền</p>
                      <p className="text-sm font-bold text-[#f5821f]">
                        {formatVND(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Right column (1/3) ---- */}
          <div className="flex flex-col gap-4">

            {/* Status badge */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Trạng thái</p>
              <span
                className={`px-5 py-2 rounded-full text-base font-bold border ${STATUS_BADGE_CLASSES[order.status]}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
              <p className="text-xs text-gray-400">Cập nhật: {formatDate(order.updatedAt)}</p>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Tóm tắt đơn hàng</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="text-gray-800">{formatVND(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <span className={order.shipping === 0 ? 'text-green-600 font-medium' : 'text-gray-800'}>
                    {order.shipping === 0 ? 'Miễn phí' : formatVND(order.shipping)}
                  </span>
                </div>
                <div className="border-t border-gray-100 mt-2 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-800">Tổng cộng</span>
                  <span className="font-bold text-[#f5821f] text-base">{formatVND(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Thông tin giao hàng</h3>
              <div className="flex flex-col gap-2.5 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Người nhận</p>
                  <p className="font-medium text-gray-800 mt-0.5">{order.contactName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-gray-700 mt-0.5 break-all">{order.contactEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Điện thoại</p>
                  <p className="text-gray-700 mt-0.5">{order.contactPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Địa chỉ</p>
                  <p className="text-gray-700 mt-0.5 leading-relaxed">{order.address}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-[#3762cc]" />
              Liên hệ hỗ trợ
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
