'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-20 h-20 text-[#f5821f]" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-gray-800">
          Đã xảy ra lỗi
        </h1>

        {/* Subtext */}
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => unstable_retry()}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-[#3762cc] hover:bg-[#2a4fa3] text-white transition-colors"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium border border-[#3762cc] text-[#3762cc] hover:bg-blue-50 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
