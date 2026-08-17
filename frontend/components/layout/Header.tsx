'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, User, ChevronDown, Package, LogOut } from 'lucide-react'
import SearchBar from './SearchBar'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) {
    return (
      <>
        <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-[#3762cc] transition-colors">
          Đăng nhập
        </Link>
        <Link
          href="/auth/register"
          className="text-sm font-medium text-white bg-[#3762cc] hover:bg-[#2a4fa3] px-4 py-2 rounded-lg transition-colors"
        >
          Đăng ký
        </Link>
      </>
    )
  }

  const displayName = user.fullName ?? user.name ?? user.email

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#3762cc] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#3762cc] flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="hidden lg:block max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-400">Tài khoản</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#3762cc] transition-colors"
          >
            <Package className="w-4 h-4" />
            Đơn hàng của tôi
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); logout() }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header({ storeName = 'ShopVN' }: { storeName?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 text-2xl font-bold text-[#1c3b71] hover:text-[#3762cc] transition-colors">
              {storeName}
            </Link>

            {/* Search bar — center */}
            <SearchBar className="hidden md:flex flex-1 max-w-xl" />

            {/* Right side — desktop */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/cart" className="relative p-1 text-gray-700 hover:text-[#3762cc] transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#f5821f] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              <UserMenu />
            </div>

            {/* Mobile: hamburger */}
            <button
              className="md:hidden p-1 text-gray-700 hover:text-[#3762cc] transition-colors"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden pb-3">
            <SearchBar className="w-full" />
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <nav className="bg-[#3762cc] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="hidden md:flex items-center gap-1 h-10">
            <li>
              <Link href="/" className="px-4 py-2 text-sm font-medium text-white hover:text-[#f5821f] transition-colors">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link href="/shop" className="px-4 py-2 text-sm font-medium text-white hover:text-[#f5821f] transition-colors">
                Sản phẩm
              </Link>
            </li>
            <li>
              <Link href="/cart" className="px-4 py-2 text-sm font-medium text-white hover:text-[#f5821f] transition-colors">
                Giỏ hàng
              </Link>
            </li>
            <li>
              <Link href="/orders" className="px-4 py-2 text-sm font-medium text-white hover:text-[#f5821f] transition-colors">
                Đơn hàng
              </Link>
            </li>
          </ul>

          {/* Mobile nav trigger row */}
          <div className="md:hidden flex items-center justify-between h-10">
            <span className="text-sm font-medium text-white">Danh mục</span>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 w-full shadow-lg">
          <ul className="flex flex-col px-4 py-3 gap-1">
            <li>
              <Link href="/" className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#3762cc]" onClick={() => setMobileMenuOpen(false)}>
                Trang chủ
              </Link>
            </li>
            <li>
              <Link href="/shop" className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#3762cc]" onClick={() => setMobileMenuOpen(false)}>
                Sản phẩm
              </Link>
            </li>
            <li>
              <Link href="/cart" className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#3762cc]" onClick={() => setMobileMenuOpen(false)}>
                Giỏ hàng
              </Link>
            </li>
            <li>
              <Link href="/orders" className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#3762cc]" onClick={() => setMobileMenuOpen(false)}>
                Đơn hàng
              </Link>
            </li>

            {user ? (
              <>
                <li className="border-t border-gray-200 mt-1 pt-1">
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-400">Đã đăng nhập</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName ?? user.name ?? user.email}</p>
                  </div>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); logout() }}
                    className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="border-t border-gray-200 mt-1 pt-1">
                  <Link href="/auth/login" className="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#3762cc]" onClick={() => setMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="block py-2 px-3 rounded-lg text-sm font-medium text-white bg-[#3762cc] hover:bg-[#2a4fa3] text-center" onClick={() => setMobileMenuOpen(false)}>
                    Đăng ký
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
