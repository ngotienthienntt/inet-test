import type { Metadata } from "next";
import "./globals.css";
import ConditionalShell from "@/components/layout/ConditionalShell";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Agentation } from "agentation";

async function fetchStoreName(): Promise<string> {
  try {
    const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${baseUrl}/settings`, { next: { revalidate: 300 } })
    if (!res.ok) return 'ShopVN'
    const data = await res.json()
    return data.storeName || 'ShopVN'
  } catch {
    return 'ShopVN'
  }
}

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: { default: 'ShopVN — Mua sắm trực tuyến', template: '%s | ShopVN' },
  description: 'ShopVN — Cửa hàng trực tuyến uy tín với hàng ngàn sản phẩm chất lượng cao, giao hàng nhanh toàn quốc.',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'ShopVN',
    title: 'ShopVN — Mua sắm trực tuyến',
    description: 'ShopVN — Cửa hàng trực tuyến uy tín.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'ShopVN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopVN — Mua sắm trực tuyến',
    description: 'ShopVN — Cửa hàng trực tuyến uy tín.',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeName = await fetchStoreName();

  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            <ConditionalShell storeName={storeName}>{children}</ConditionalShell>
          </CartProvider>
        </AuthProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
