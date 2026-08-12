import { Product } from '../products/entities/product.entity';

export interface ProductDocument {
  id: number;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  badge: string;
  isActive: boolean;
  images: string[];
  minPrice: number;
  maxPrice: number;
  variants: {
    size: string;
    colorName: string;
    price: number;
    originalPrice: number;
    stock: number;
  }[];
  createdAt: string;
}

export function toProductDocument(product: Product): ProductDocument {
  const prices = (product.variants ?? []).map((v) => Number(v.price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? '',
    category: product.category?.name ?? '',
    categorySlug: product.category?.slug ?? '',
    badge: product.badge ?? '',
    isActive: product.isActive,
    images: (product.images ?? []).map((img) => img.url),
    minPrice,
    maxPrice,
    variants: (product.variants ?? []).map((v) => ({
      size: v.size ?? '',
      colorName: v.colorName ?? '',
      price: Number(v.price),
      originalPrice: Number(v.originalPrice),
      stock: v.stock,
    })),
    createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
  };
}
