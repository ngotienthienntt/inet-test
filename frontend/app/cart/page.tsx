'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'

export default function CartPage() {
  const { items, savedItems, totalItems, removeItem, updateQuantity, saveForLater, moveToCart, clearCart, loading } = useCart()

  if (totalItems === 0 && savedItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <ShoppingCart className="w-20 h-20 text-gray-300" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Giỏ hàng của bạn đang trống</h2>
          <p className="text-sm text-gray-500 mt-1">Hãy thêm sản phẩm để bắt đầu mua sắm</p>
        </div>
        <Link
          href="/shop"
          className="px-6 py-3 text-sm font-semibold text-white bg-[#3762cc] hover:bg-[#2a4fa3] rounded-lg transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Giỏ hàng ({totalItems} sản phẩm)
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: cart items */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Bulk actions */}
          {items.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
              <span className="text-sm text-gray-600">
                Chọn tất cả ({items.length} sản phẩm)
              </span>
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Active cart items */}
          {items.length > 0 ? (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onRemove={removeItem}
                  onUpdateQty={updateQuantity}
                  onSaveForLater={saveForLater}
                  isSaved={false}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
              Không có sản phẩm nào trong giỏ hàng
            </div>
          )}

          {/* Saved for later */}
          {savedItems.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Sản phẩm lưu để sau ({savedItems.length})
              </h2>
              <div className="flex flex-col gap-3">
                {savedItems.map((item) => (
                  <CartItem
                    key={item.product.id}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQty={updateQuantity}
                    onMoveToCart={moveToCart}
                    isSaved={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: summary sticky */}
        <div className="w-full lg:w-80 xl:w-96 sticky top-24 flex-shrink-0">
          <CartSummary />
        </div>
      </div>
    </div>
  )
}
