'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCart } from '@/context/CartContext'

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

function getBadgeClass(badge: string): string {
  switch (badge) {
    case 'HOT':
      return 'bg-red-500'
    case 'SALE':
      return 'bg-orange-500'
    case 'MỚI':
      return 'bg-green-500'
    default:
      return ''
  }
}

function calcDiscount(price: number, originalPrice: number): number {
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-yellow-400 text-xs leading-none">
        {'★'.repeat(full)}
        {half ? '½' : ''}
        <span className="text-gray-300">{'★'.repeat(empty)}</span>
      </span>
      <span className="text-xs text-gray-400">({reviewCount})</span>
    </div>
  )
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const discount = calcDiscount(product.price, product.originalPrice)
  const badgeClass = getBadgeClass(product.badge)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (!product.variantId) return
    addItem(product, product.variantId, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault()
    if (!product.variantId) return
    addItem(product, product.variantId, 1)
    router.push('/checkout')
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 group flex flex-col cursor-pointer"
    >
      {/* Image */}
      <div className="relative">
        <Image
          src={product.image || 'https://placehold.co/300x300/e2e8f0/64748b'}
          alt={product.name}
          width={300}
          height={300}
          unoptimized
          className="w-full h-48 object-cover"
        />

        {/* Badge */}
        {product.badge && badgeClass && (
          <span
            className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded ${badgeClass}`}
          >
            {product.badge}
          </span>
        )}

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-gray-200/70 flex items-center justify-center">
            <span className="bg-white/90 text-gray-600 text-sm font-semibold px-3 py-1 rounded-full shadow">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 flex-1">
          {product.name}
        </p>

        <StarRating rating={product.rating} reviewCount={product.reviewCount} />

        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {product.tags.map(tag => (
              <span key={tag.id} className="text-[10px] font-medium text-[#3762cc] bg-blue-50 px-1.5 py-0.5 rounded">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 mb-3">
          <p className="text-base font-bold text-[#f5821f]">
            {formatVND(product.price)}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400 line-through">
              {formatVND(product.originalPrice)}
            </p>
            {discount > 0 && (
              <span className="text-xs text-red-500 font-semibold">-{discount}%</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {product.inStock && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={added || !product.variantId}
              title={added ? 'Đã thêm!' : 'Thêm vào giỏ'}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                added
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-[#3762cc] text-[#3762cc] hover:bg-[#3762cc] hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{added ? 'Đã thêm' : 'Giỏ hàng'}</span>
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!product.variantId}
              title="Mua ngay"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-[#f5821f] hover:bg-[#d96e18] text-white transition-colors"
            >
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Mua ngay</span>
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}
