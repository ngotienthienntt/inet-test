'use client'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function ConditionalShell({ children, storeName }: { children: React.ReactNode; storeName?: string }) {
  const pathname = usePathname()

  // Admin pages have their own layout — skip customer Header/Footer
  if (pathname.startsWith('/admin')) {
    return <>{children}</>
  }

  return (
    <>
      <Header storeName={storeName} />
      <main className="flex-1">{children}</main>
      <Footer storeName={storeName} />
    </>
  )
}
