import Link from 'next/link'
import { Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center relative">
        {/* Decorative ghost icon behind the 404 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <Ghost className="w-64 h-64 text-gray-100" strokeWidth={1} />
        </div>

        {/* 404 number */}
        <p className="relative text-8xl font-bold text-[#3762cc] leading-none">
          404
        </p>

        {/* Heading */}
        <h1 className="relative mt-4 text-2xl font-semibold text-gray-800">
          Trang không tìm thấy
        </h1>

        {/* Subtext */}
        <p className="relative mt-2 text-gray-500 max-w-md mx-auto">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>

        {/* Action buttons */}
        <div className="relative mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-[#3762cc] hover:bg-[#2a4fa3] text-white transition-colors"
          >
            Về trang chủ
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium border border-[#3762cc] text-[#3762cc] hover:bg-blue-50 transition-colors"
          >
            Xem sản phẩm
          </Link>
        </div>
      </div>
    </div>
  )
}
