import Link from 'next/link'

export default function HeroBanner() {
  return (
    <section className="w-full bg-gradient-to-r from-[#1c3b71] to-[#3762cc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-8 min-h-[320px] py-10">
          {/* Left: text content */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Mua sắm thông minh
            </h1>
            <p className="text-blue-100 text-base sm:text-lg mb-8 max-w-md mx-auto md:mx-0">
              Hàng nghìn sản phẩm chính hãng — Giao hàng toàn quốc
            </p>
            <Link
              href="/shop"
              className="inline-block bg-[#f5821f] hover:bg-[#e07018] text-white font-semibold px-8 py-3 rounded-lg transition-colors text-base"
            >
              Khám phá ngay →
            </Link>
          </div>

          {/* Right: banner placeholder */}
          <div className="flex-1 w-full md:max-w-sm lg:max-w-md">
            <div className="bg-white/10 rounded-xl w-full aspect-video flex items-center justify-center border border-white/20">
              <span className="text-white/60 text-lg font-medium">Ảnh Banner</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
