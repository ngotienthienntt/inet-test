'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import type { CartProduct } from '@/context/CartContext'

interface HomeProductActionsProps {
  product: CartProduct
  variantId: number | undefined
}

export default function HomeProductActions({ product, variantId }: HomeProductActionsProps) {
  const { addItem } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!variantId) return
    addItem(product, variantId, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  async function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!variantId) return
    addItem(product, variantId, 1)
    router.push('/checkout')
  }

  if (!variantId) return null

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={handleAddToCart}
        title={added ? 'Đã thêm!' : 'Thêm vào giỏ'}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          added
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-white border-[#3762cc] text-[#3762cc] hover:bg-[#3762cc] hover:text-white'
        }`}
      >
        <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline truncate">{added ? 'Đã thêm' : 'Giỏ hàng'}</span>
      </button>

      <button
        type="button"
        onClick={handleBuyNow}
        title="Mua ngay"
        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-[#f5821f] hover:bg-[#d96e18] text-white transition-colors"
      >
        <Zap className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline">Mua ngay</span>
      </button>
    </div>
  )
}
