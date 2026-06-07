'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Truck, RotateCcw } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCart } from '@/context/CartContext'

interface AddToCartSectionProps {
  product: Product
  variantId?: number
}

export default function AddToCartSection({ product, variantId }: AddToCartSectionProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  async function handleAddToCart() {
    const id = variantId ?? product.variantId
    if (!id) return
    addItem(product, id, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function increment() {
    setQuantity((q) => Math.min(99, q + 1))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val)) {
      setQuantity(Math.min(99, Math.max(1, val)))
    }
  }

  if (!product.inStock) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled
          className="w-full py-3 px-6 bg-gray-300 text-gray-500 text-base font-semibold rounded-xl cursor-not-allowed"
        >
          Hết hàng
        </button>
        <TrustBadges />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity stepper */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Số lượng:</span>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={decrement}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
            aria-label="Giảm số lượng"
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={handleChange}
            min={1}
            max={99}
            className="w-14 h-10 text-center text-sm font-semibold border-x border-gray-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={increment}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={added || !(variantId ?? product.variantId)}
          className="w-full py-3 px-6 bg-[#3762cc] hover:bg-[#2a4fa3] disabled:bg-green-500 text-white text-base font-semibold rounded-xl transition-colors"
        >
          {added ? 'Đã thêm vào giỏ!' : 'Thêm vào giỏ hàng'}
        </button>
        <Link
          href="/checkout"
          className="w-full py-3 px-6 bg-[#f5821f] hover:bg-[#d96e18] text-white text-base font-semibold rounded-xl transition-colors text-center"
        >
          Mua ngay
        </Link>
      </div>

      <TrustBadges />
    </div>
  )
}

function TrustBadges() {
  return (
    <div className="flex items-center justify-around border-t border-gray-100 pt-4 mt-1">
      <div className="flex flex-col items-center gap-1 text-center">
        <Shield className="w-5 h-5 text-[#3762cc]" />
        <span className="text-xs text-gray-500 leading-tight">Bảo hành<br />chính hãng</span>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <Truck className="w-5 h-5 text-[#3762cc]" />
        <span className="text-xs text-gray-500 leading-tight">Giao hàng<br />toàn quốc</span>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <RotateCcw className="w-5 h-5 text-[#3762cc]" />
        <span className="text-xs text-gray-500 leading-tight">Đổi trả<br />7 ngày</span>
      </div>
    </div>
  )
}
