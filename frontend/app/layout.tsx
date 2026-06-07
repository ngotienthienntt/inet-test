import type { Metadata } from "next";
import "./globals.css";
import ConditionalShell from "@/components/layout/ConditionalShell";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            <ConditionalShell>{children}</ConditionalShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
