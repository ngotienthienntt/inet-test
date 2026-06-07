'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ordersApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
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
}

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN')
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Đang xử lý', value: 'processing' },
  { label: 'Đang giao', value: 'shipped' },
  { label: 'Đã giao', value: 'delivered' },
  { label: 'Đã huỷ', value: 'cancelled' },
]

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
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString()),
    items,
    subtotal: Number(raw.subtotal ?? 0),
    shipping: Number(raw.shipping ?? 0),
    total: Number(raw.total ?? 0),
  }
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('')

  useEffect(() => {
    if (authLoading) return

    const hasJwt = Boolean(getToken())
    const sessionToken = getSessionToken() ?? undefined

    // Need at least one identifier to fetch orders
    if (!hasJwt && !sessionToken) {
      setLoading(false)
      return
    }

    ordersApi
      .list(activeStatus ? { status: activeStatus } : undefined, sessionToken)
      .then((res) => {
        const raw: unknown[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.orders)
          ? res.data.orders
          : Array.isArray(res.data?.data)
          ? res.data.data
          : []
        setOrders(raw.map((item) => mapOrder(item as Record<string, unknown>)))
      })
      .catch(() => {
        setOrders([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user, authLoading, activeStatus])

  // No JWT and no session token — truly anonymous
  if (!authLoading && !user && !getToken() && !getSessionToken()) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-7 h-7 text-[#3762cc]" />
            <h1 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
          </div>
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-semibold">Đăng nhập để xem đơn hàng</p>
            <p className="text-gray-400 text-sm mt-1">Bạn cần đăng nhập để xem lịch sử đơn hàng của mình.</p>
            <Link
              href="/auth/login"
              className="inline-block mt-6 px-6 py-3 bg-[#3762cc] text-white rounded-xl font-semibold hover:bg-[#2a4fa3] transition-colors text-sm"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const filtered = activeStatus
    ? orders.filter((o) => o.status === activeStatus)
    : orders

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-7 h-7 text-[#3762cc]" />
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
          {FILTER_TABS.map((tab) => {
            const isActive = activeStatus === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveStatus(tab.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#3762cc] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Loading state */}
        {(loading || authLoading) ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm">Đang tải đơn hàng...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Không có đơn hàng nào</p>
            <p className="text-gray-400 text-sm mt-1">Hãy khám phá thêm sản phẩm và đặt hàng nhé!</p>
            <Link
              href="/shop"
              className="inline-block mt-6 px-6 py-3 bg-[#3762cc] text-white rounded-xl font-semibold hover:bg-[#2a4fa3] transition-colors text-sm"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((order) => {
              const firstItem = order.items[0]
              const extraCount = order.items.length - 1
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 text-sm">
                        #{order.orderNumber}
                      </span>
                      <span className="text-gray-400 text-sm">{formatDate(order.createdAt)}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE_CLASSES[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  {/* Items preview */}
                  {firstItem && (
                    <div className="px-5 py-4 flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={firstItem.image}
                          alt={firstItem.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{firstItem.name}</p>
                        {firstItem.variant && (
                          <p className="text-xs text-gray-400">{firstItem.variant}</p>
                        )}
                      </div>
                      {extraCount > 0 && (
                        <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          +{extraCount} sản phẩm khác
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card footer */}
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
                    <div>
                      <span className="text-xs text-gray-500">Tổng tiền: </span>
                      <span className="text-base font-bold text-[#f5821f]">
                        {formatVND(order.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Mua lại
                      </button>
                      <Link
                        href={`/orders/${order.id}`}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-[#3762cc] rounded-lg hover:bg-[#2a4fa3] transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
