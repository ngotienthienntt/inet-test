'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { cartApi, authApi } from '@/lib/api'
import { getToken, getSessionToken, setSessionToken } from '@/lib/auth'

export interface CartProduct {
  id: number | string
  name: string
  slug: string
  price: number
  originalPrice: number
  image: string
  category: string
  categorySlug: string
  badge: string
  rating: number
  reviewCount: number
  inStock: boolean
}

// Keep backward-compatible Product alias
export type Product = CartProduct

export interface CartItem {
  product: CartProduct
  quantity: number
  savedForLater: boolean
  // API-level cart item id (used for update/remove/save-later calls)
  cartItemId?: string | number
}

interface CartContextValue {
  items: CartItem[]
  savedItems: CartItem[]
  totalItems: number
  subtotal: number
  loading: boolean
  addItem: (product: CartProduct, variantId: number, quantity?: number) => void
  removeItem: (productId: number | string) => void
  updateQuantity: (productId: number | string, quantity: number) => void
  saveForLater: (productId: number | string) => void
  moveToCart: (productId: number | string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

// Map an API cart response to CartItem[]
function mapApiCart(data: unknown): CartItem[] {
  if (!data || typeof data !== 'object') return []
  const root = data as Record<string, unknown>

  // Backend returns { cart: { items: [...] }, summary: {} }
  const cartObj = (root.cart ?? root) as Record<string, unknown>
  const rawItems: unknown[] = Array.isArray(cartObj.items) ? (cartObj.items as unknown[]) : []

  return rawItems.map((raw): CartItem => {
    const item = raw as Record<string, unknown>
    // Backend: item.variant.product for product info, item.variant for price
    const variant = (item.variant ?? {}) as Record<string, unknown>
    const productRaw = (variant.product ?? item.product ?? {}) as Record<string, unknown>
    const images = productRaw.images as Array<Record<string, unknown>> | undefined
    const primaryImage =
      images?.find((img) => img.isPrimary)?.url ??
      images?.[0]?.url ??
      (productRaw.image as string | undefined) ??
      ''

    const product: CartProduct = {
      id: (productRaw.id ?? item.productId ?? 0) as number | string,
      name: (productRaw.name ?? '') as string,
      slug: (productRaw.slug ?? '') as string,
      price: Number(variant.price ?? productRaw.price ?? item.price ?? 0),
      originalPrice: Number(variant.originalPrice ?? variant.price ?? productRaw.price ?? 0),
      image: primaryImage as string,
      category: (productRaw.category ?? '') as string,
      categorySlug: (productRaw.categorySlug ?? '') as string,
      badge: (productRaw.badge ?? '') as string,
      rating: Number(productRaw.rating ?? 0),
      reviewCount: Number(productRaw.reviewCount ?? productRaw.review_count ?? 0),
      inStock: (productRaw.inStock ?? productRaw.in_stock ?? true) as boolean,
    }

    return {
      product,
      quantity: Number(item.quantity ?? 1),
      savedForLater: Boolean(item.savedForLater ?? item.saved_for_later ?? false),
      cartItemId: (item.id ?? item.cartItemId) as string | number | undefined,
    }
  })
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [allItems, setAllItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionToken, setSessionTokenState] = useState<string | null>(null)

  // Fetch cart from API
  const fetchCart = useCallback(async (token?: string) => {
    try {
      const res = await cartApi.get(token)
      const mapped = mapApiCart(res.data)
      setAllItems(mapped)
    } catch {
      // Keep last known state on error
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const authToken = getToken()

        if (authToken) {
          // Authenticated user — fetch cart with JWT (attached by interceptor)
          await fetchCart()
        } else {
          // Guest user
          let storedSession = getSessionToken()

          if (!storedSession) {
            // Create guest session
            try {
              const res = await authApi.guest()
              const newSession: string =
                res.data?.sessionToken ?? res.data?.token ?? res.data?.session ?? ''
              if (newSession) {
                setSessionToken(newSession)
                storedSession = newSession
              }
            } catch {
              // Could not create guest session, proceed without
            }
          }

          setSessionTokenState(storedSession)
          if (storedSession) {
            await fetchCart(storedSession)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [fetchCart])

  const items = allItems.filter((item) => !item.savedForLater)
  const savedItems = allItems.filter((item) => item.savedForLater)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const addItem = useCallback(
    async (product: CartProduct, variantId: number, quantity = 1) => {
      // Optimistic update
      setAllItems((prev) => {
        const existing = prev.find(
          (item) => item.product.id === product.id && !item.savedForLater
        )
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id && !item.savedForLater
              ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
              : item
          )
        }
        return [...prev, { product, quantity, savedForLater: false }]
      })

      try {
        const token = sessionToken ?? undefined
        await cartApi.addItem({ variantId, quantity }, token)
        await fetchCart(token)
      } catch {
        // Keep optimistic state
      }
    },
    [sessionToken, fetchCart]
  )

  const removeItem = useCallback(
    async (productId: number | string) => {
      const target = allItems.find((item) => item.product.id === productId)
      // Optimistic update
      setAllItems((prev) => prev.filter((item) => item.product.id !== productId))

      try {
        const id = target?.cartItemId ?? productId
        const token = sessionToken ?? undefined
        await cartApi.removeItem(id, token)
        await fetchCart(token)
      } catch {
        // Keep optimistic state
      }
    },
    [allItems, sessionToken, fetchCart]
  )

  const updateQuantity = useCallback(
    async (productId: number | string, quantity: number) => {
      const target = allItems.find((item) => item.product.id === productId)
      const clamped = Math.max(1, Math.min(99, quantity))

      // Optimistic update
      setAllItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: clamped } : item
        )
      )

      try {
        const id = target?.cartItemId ?? productId
        const token = sessionToken ?? undefined
        await cartApi.updateItem(id, { quantity: clamped }, token)
        await fetchCart(token)
      } catch {
        // Keep optimistic state
      }
    },
    [allItems, sessionToken, fetchCart]
  )

  const saveForLater = useCallback(
    async (productId: number | string) => {
      const target = allItems.find((item) => item.product.id === productId)

      // Optimistic update
      setAllItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, savedForLater: true } : item
        )
      )

      try {
        const id = target?.cartItemId ?? productId
        const token = sessionToken ?? undefined
        await cartApi.saveForLater(id, token)
        await fetchCart(token)
      } catch {
        // Keep optimistic state
      }
    },
    [allItems, sessionToken, fetchCart]
  )

  const moveToCart = useCallback(
    async (productId: number | string) => {
      const target = allItems.find((item) => item.product.id === productId)

      // Optimistic update
      setAllItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, savedForLater: false } : item
        )
      )

      try {
        const id = target?.cartItemId ?? productId
        const token = sessionToken ?? undefined
        await cartApi.updateItem(id, { savedForLater: false }, token)
        await fetchCart(token)
      } catch {
        // Keep optimistic state
      }
    },
    [allItems, sessionToken, fetchCart]
  )

  const clearCart = useCallback(async () => {
    // Optimistic update: keep saved items
    setAllItems((prev) => prev.filter((item) => item.savedForLater))

    try {
      const token = sessionToken ?? undefined
      await cartApi.clear(token)
      await fetchCart(token)
    } catch {
      // Keep optimistic state
    }
  }, [sessionToken, fetchCart])

  return (
    <CartContext.Provider
      value={{
        items,
        savedItems,
        totalItems,
        subtotal,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        saveForLater,
        moveToCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}
