'use client'

import { useMemo, useState } from 'react'
import type { ProductDetail, ProductVariant } from '@/lib/types'
import VariantSelector from './VariantSelector'
import AddToCartSection from './AddToCartSection'

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

function calcDiscount(price: number, originalPrice: number): number {
  if (!originalPrice) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

// Default to the cheapest variant, matching the "giá từ" convention used
// on the listing pages (home, /shop) — the price shown here should agree
// with the price the customer clicked through from.
function cheapestVariant(variants: ProductVariant[]): ProductVariant | undefined {
  if (variants.length === 0) return undefined
  return variants.reduce((min, v) => (v.price < min.price ? v : min), variants[0])
}

export default function ProductPurchasePanel({ detail }: { detail: ProductDetail }) {
  const initial = cheapestVariant(detail.variants)
  const [selectedSize, setSelectedSize] = useState(initial?.size ?? '')
  const [selectedColor, setSelectedColor] = useState(initial?.colorName ?? '')

  const sizes = useMemo(
    () => [...new Set(detail.variants.map(v => v.size).filter(Boolean))] as string[],
    [detail.variants],
  )
  const colors = useMemo(() => {
    const map = new Map<string, string>()
    for (const v of detail.variants) {
      if (v.colorName && v.colorHex) map.set(v.colorName, v.colorHex)
    }
    return [...map.entries()].map(([name, hex]) => ({ name, hex }))
  }, [detail.variants])

  const selectedVariant = useMemo(() => {
    const match = detail.variants.find(
      v => (sizes.length === 0 || v.size === selectedSize) && (colors.length === 0 || v.colorName === selectedColor),
    )
    return match ?? initial
  }, [detail.variants, sizes.length, colors.length, selectedSize, selectedColor, initial])

  const price = selectedVariant?.price ?? detail.price
  const originalPrice = selectedVariant?.originalPrice ?? detail.originalPrice
  const discount = calcDiscount(price, originalPrice)

  return (
    <>
      {/* Price */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-[#f5821f]">
          {formatVND(price)}
        </span>
        {discount > 0 && (
          <>
            <span className="text-lg text-gray-400 line-through mb-0.5">
              {formatVND(originalPrice)}
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-lg mb-0.5">
              -{discount}%
            </span>
          </>
        )}
      </div>

      {/* Variant selector */}
      {(sizes.length > 0 || colors.length > 0) && (
        <VariantSelector
          sizes={sizes}
          colors={colors}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onSelectSize={setSelectedSize}
          onSelectColor={setSelectedColor}
        />
      )}

      {/* Add to cart */}
      <AddToCartSection product={detail} variantId={selectedVariant?.id} />
    </>
  )
}
