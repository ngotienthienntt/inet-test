import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#232323] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company info */}
          <div>
            <p className="text-2xl font-bold text-white mb-3">ShopVN</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              ShopVN — điểm mua sắm trực tuyến uy tín với hàng nghìn sản phẩm chính hãng,
              giao hàng toàn quốc, đổi trả dễ dàng.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Giỏ hàng
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Đơn hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Hỗ trợ khách hàng
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Chính sách giao hàng
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Bảo hành sản phẩm
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Liên hệ
            </h3>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">
                📍 123 Nguyễn Huệ, Q.1, TP.HCM
              </li>
              <li className="text-gray-400 text-sm">
                <a href="tel:+84000000000" className="hover:text-white transition-colors">
                  📞 1800 000 000 (Miễn phí)
                </a>
              </li>
              <li className="text-gray-400 text-sm">
                <a href="mailto:support@shopvn.com" className="hover:text-white transition-colors">
                  ✉️ support@shopvn.com
                </a>
              </li>
              <li className="text-gray-400 text-sm">
                🕐 8:00 – 22:00 (Thứ 2 – CN)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-sm">
            &copy; 2025 ShopVN. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-gray-500 text-xs hover:text-gray-300 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="text-gray-500 text-xs hover:text-gray-300 transition-colors">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
