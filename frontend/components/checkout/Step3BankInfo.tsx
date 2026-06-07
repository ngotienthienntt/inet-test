'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Copy, AlertTriangle } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { CheckoutOrderResult } from '@/app/checkout/page'

const DEFAULT_BANK_ACCOUNT = '1234567890'
const DEFAULT_BANK_NAME = 'Vietcombank'
const DEFAULT_ACCOUNT_HOLDER = 'CÔNG TY SHOPVN'

function formatVND(price: number): string {
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

interface Step3BankInfoProps {
  orderResult?: CheckoutOrderResult | null
}

export default function Step3BankInfo({ orderResult }: Step3BankInfoProps) {
  const { subtotal, clearCart } = useCart()
  const [copiedField, setCopiedField] = useState<'account' | 'content' | null>(null)
  const clearedRef = useRef(false)

  const orderNumber = orderResult?.orderNumber ?? '#VN' + Date.now()
  const total = orderResult?.total ?? subtotal
  const bankAccount = orderResult?.bankAccount ?? DEFAULT_BANK_ACCOUNT
  const bankName = orderResult?.bankName ?? DEFAULT_BANK_NAME
  const accountHolder = orderResult?.accountHolder ?? DEFAULT_ACCOUNT_HOLDER
  const orderId = orderResult?.orderId ?? ''

  useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true
      clearCart()
    }
  }, [clearCart])

  async function copyToClipboard(text: string, field: 'account' | 'content') {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Success header */}
      <div className="flex flex-col items-center gap-3 py-4">
        <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={1.5} />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Đặt hàng thành công!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Vui lòng chuyển khoản để hoàn tất đơn hàng
          </p>
          <p className="text-xs text-gray-400 mt-1">Mã đơn hàng: {orderNumber}</p>
        </div>
      </div>

      {/* Bank info card */}
      <div className="border-2 border-[#3762cc] rounded-xl overflow-hidden">
        <div className="bg-[#3762cc] px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Thông tin chuyển khoản</h3>
        </div>
        <div className="bg-white px-4 py-4 flex flex-col gap-3 text-sm">
          {/* Bank name */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Ngân hàng</span>
            <span className="font-semibold text-gray-900">{bankName}</span>
          </div>

          {/* Account number */}
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-500 flex-shrink-0">Số tài khoản</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 tracking-widest">
                {bankAccount}
              </span>
              <button
                onClick={() => copyToClipboard(bankAccount, 'account')}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[#3762cc] bg-blue-50 hover:bg-blue-100 transition-colors"
                title="Sao chép số tài khoản"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedField === 'account' ? 'Đã sao chép!' : 'Sao chép'}
              </button>
            </div>
          </div>

          {/* Account holder */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Chủ tài khoản</span>
            <span className="font-semibold text-gray-900">{accountHolder}</span>
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Số tiền</span>
            <span className="font-bold text-[#f5821f] text-base">{formatVND(total)}</span>
          </div>

          {/* Transfer content */}
          <div className="flex justify-between items-center gap-2">
            <span className="text-gray-500 flex-shrink-0">Nội dung CK</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{orderNumber}</span>
              <button
                onClick={() => copyToClipboard(orderNumber, 'content')}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[#3762cc] bg-blue-50 hover:bg-blue-100 transition-colors"
                title="Sao chép nội dung chuyển khoản"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedField === 'content' ? 'Đã sao chép!' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Important note */}
      <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-800">
          Đơn hàng sẽ được xử lý sau khi nhận được thanh toán trong 24h
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {orderId ? (
          <Link
            href={`/orders/${orderId}`}
            className="flex-1 text-center py-3 text-sm font-semibold text-[#3762cc] border-2 border-[#3762cc] hover:bg-blue-50 rounded-lg transition-colors"
          >
            Xem đơn hàng
          </Link>
        ) : (
          <Link
            href="/orders"
            className="flex-1 text-center py-3 text-sm font-semibold text-[#3762cc] border-2 border-[#3762cc] hover:bg-blue-50 rounded-lg transition-colors"
          >
            Xem đơn hàng
          </Link>
        )}
        <Link
          href="/shop"
          className="flex-1 text-center py-3 text-sm font-semibold text-white bg-[#3762cc] hover:bg-[#2a4fa3] rounded-lg transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  )
}
