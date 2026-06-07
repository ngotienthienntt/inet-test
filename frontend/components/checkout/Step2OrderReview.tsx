'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { ordersApi } from '@/lib/api'
import { getSessionToken } from '@/lib/auth'
import type { ContactFormData } from './Step1ContactForm'
import type { CheckoutOrderResult } from '@/app/checkout/page'

interface Step2OrderReviewProps {
  contactData: ContactFormData
  onBack: () => void
  onNext: (result: CheckoutOrderResult) => void
}

function formatVND(price: number): string {
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

export default function Step2OrderReview({ contactData, onBack, onNext }: Step2OrderReviewProps) {
  const { items, subtotal } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePlaceOrder() {
    setLoading(true)
    setError(null)

    try {
      const sessionToken = getSessionToken() ?? undefined
      const orderPayload = {
        fullName: contactData.fullName,
        email: contactData.email,
        phone: contactData.phone,
        address: contactData.address,
        note: contactData.note,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        subtotal,
        shipping: 0,
        total: subtotal,
      }

      const res = await ordersApi.checkout(orderPayload, sessionToken)
      const data = res.data as Record<string, unknown>

      const result: CheckoutOrderResult = {
        orderId: String(data.id ?? data.orderId ?? data.order_id ?? ''),
        orderNumber: String(
          data.orderNumber ?? data.order_number ?? data.id ?? '#VN' + Date.now()
        ),
        total: Number(data.total ?? subtotal),
        bankAccount: data.bankAccount as string | undefined,
        bankName: data.bankName as string | undefined,
        accountHolder: data.accountHolder as string | undefined,
      }

      onNext(result)
    } catch {
      setError('Đặt hàng thất bại. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Order items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            Sản phẩm đặt mua ({items.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 px-4 py-3">
              <div className="relative w-[60px] h-[60px] flex-shrink-0 rounded-md overflow-hidden border border-gray-100 bg-gray-50">
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Số lượng: {item.quantity}
                </p>
              </div>
              <div className="text-sm font-semibold text-gray-900 flex-shrink-0">
                {formatVND(item.product.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing summary */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tạm tính</span>
            <span>{formatVND(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Phí vận chuyển</span>
            <span className="text-green-600 font-medium">Miễn phí</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Tổng cộng</span>
            <span className="text-[#f5821f]">{formatVND(subtotal)}</span>
          </div>
        </div>
      </div>

      {/* Contact info summary */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Thông tin nhận hàng</h2>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2 text-sm text-gray-700">
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0">Họ và tên:</span>
            <span className="font-medium">{contactData.fullName}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0">Email:</span>
            <span className="font-medium">{contactData.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0">Điện thoại:</span>
            <span className="font-medium">{contactData.phone}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0">Địa chỉ:</span>
            <span className="font-medium">{contactData.address}</span>
          </div>
          {contactData.note && (
            <div className="flex gap-2">
              <span className="text-gray-500 w-28 flex-shrink-0">Ghi chú:</span>
              <span className="font-medium">{contactData.note}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-1 px-5 py-3 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[#3762cc] hover:bg-[#2a4fa3] rounded-lg transition-colors disabled:opacity-70"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Đặt hàng
        </button>
      </div>
    </div>
  )
}
