'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

function formatVND(price: number): string {
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

export default function CartSummary() {
  const { totalItems, subtotal } = useCart()
  const [promoCode, setPromoCode] = useState('')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-900">Tóm tắt đơn hàng</h2>

      {/* Item count & subtotal */}
      <div className="flex flex-col gap-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Sản phẩm ({totalItems})</span>
          <span>{formatVND(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Phí vận chuyển</span>
          <span className="text-green-600 font-medium">Miễn phí</span>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-base font-semibold text-gray-900">Tổng cộng</span>
        <span className="text-xl font-bold text-[#f5821f]">{formatVND(subtotal)}</span>
      </div>

      {/* Promo code */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Mã giảm giá"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3762cc] focus:border-transparent"
        />
        <button className="px-3 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
          Áp dụng
        </button>
      </div>

      {/* Checkout button */}
      <Link
        href="/checkout"
        className="block w-full text-center py-3 text-sm font-semibold text-white bg-[#3762cc] hover:bg-[#2a4fa3] rounded-lg transition-colors"
      >
        Tiến hành thanh toán
      </Link>

      {/* Continue shopping */}
      <Link
        href="/shop"
        className="block text-center text-sm text-gray-500 hover:text-[#3762cc] transition-colors"
      >
        Tiếp tục mua sắm
      </Link>
    </div>
  )
}
