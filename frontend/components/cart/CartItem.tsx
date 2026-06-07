'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { CartItem as CartItemType } from '@/context/CartContext'

interface CartItemProps {
  item: CartItemType
  onRemove: (productId: number | string) => void
  onUpdateQty: (productId: number | string, quantity: number) => void
  onSaveForLater?: (productId: number | string) => void
  onMoveToCart?: (productId: number | string) => void
  isSaved?: boolean
}

function formatVND(price: number): string {
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

export default function CartItem({
  item,
  onRemove,
  onUpdateQty,
  onSaveForLater,
  onMoveToCart,
  isSaved = false,
}: CartItemProps) {
  const { product, quantity } = item

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border border-gray-200">
      {/* Product image */}
      <div className="flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          width={80}
          height={80}
          unoptimized
          className="w-20 h-20 object-cover rounded-md bg-gray-100"
        />
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
          </div>
          <p className="text-base font-bold text-[#f5821f] flex-shrink-0">
            {formatVND(product.price * quantity)}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quantity stepper (only for active cart items) */}
          {!isSaved ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQty(product.id, quantity - 1)}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                aria-label="Giảm số lượng"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium text-gray-900">{quantity}</span>
              <button
                onClick={() => onUpdateQty(product.id, quantity + 1)}
                disabled={quantity >= 99}
                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>
          ) : (
            <div />
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!isSaved && onSaveForLater && (
              <button
                onClick={() => onSaveForLater(product.id)}
                className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                Lưu để sau
              </button>
            )}
            {isSaved && onMoveToCart && (
              <button
                onClick={() => onMoveToCart(product.id)}
                className="text-xs text-[#3762cc] hover:text-[#2a4fa3] font-medium underline transition-colors"
              >
                Chuyển vào giỏ
              </button>
            )}
            <button
              onClick={() => onRemove(product.id)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
              aria-label="Xóa sản phẩm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
