import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { Product } from '@/lib/types'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageSearch className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg font-medium mb-2">
          Không tìm thấy sản phẩm nào
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center px-4 py-2 bg-[#3762cc] hover:bg-[#2a4fa3] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Xem tất cả
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
