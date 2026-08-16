export interface Product {
  id: number
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
  variantId?: number
}

export interface ProductVariant {
  id: number
  price: number
  originalPrice: number
  stock: number
  colorName?: string
  colorHex?: string
  size?: string
  sku?: string
}

export interface ProductDetail extends Product {
  description: string
  specs: { label: string; value: string }[]
  images: string[]
  variants: ProductVariant[]
}

export type BannerPosition = 'homepage_before_categories'

export interface Banner {
  id: number
  position: BannerPosition
  imageUrl: string
  linkUrl: string | null
  altText: string
  isActive: boolean
}
