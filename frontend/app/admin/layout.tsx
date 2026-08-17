'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/products', label: 'Sản phẩm', icon: '📦' },
  { href: '/admin/categories', label: 'Danh mục', icon: '🗂️' },
  { href: '/admin/tags', label: 'Tag đối tượng sử dụng', icon: '🏷️' },
  { href: '/admin/promotions', label: 'Khuyến mại', icon: '🎁' },
  { href: '/admin/orders', label: 'Đơn hàng', icon: '🛒' },
  { href: '/admin/customers', label: 'Khách hàng', icon: '👥' },
  { href: '/admin/inventory', label: 'Kho hàng', icon: '📋' },
  { href: '/admin/settings', label: 'Cài đặt', icon: '⚙️' },
]

function SidebarLink({ item, onClick }: { item: typeof NAV_ITEMS[0]; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-white/20 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  )
}

function AvatarMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none"
      >
        <span className="text-sm text-gray-500 hidden sm:block">Quản trị viên</span>
        <div className="w-8 h-8 bg-[#1c3b71] rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-slide-up">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700">Quản trị viên</p>
          </div>
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Login page renders standalone — no sidebar, no top bar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  function handleLogout() {
    localStorage.removeItem('shopvn_token')
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1c3b71] z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:self-start`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">ShopVN</span>
            <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Admin</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <SidebarLink key={item.href} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex-1 lg:flex-none" />
          <AvatarMenu onLogout={handleLogout} />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
