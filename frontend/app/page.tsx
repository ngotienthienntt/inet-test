import Image from 'next/image'
import Link from 'next/link'
import HeroBanner from '@/components/home/HeroBanner'
import CategoryGrid from '@/components/home/CategoryGrid'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import ProductsByCategory from '@/components/home/ProductsByCategory'

export default function Home() {
  return (
    <>
      <HeroBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <CategoryGrid />
        <FeaturedProducts />
        <Link href="/shop" className="block">
          <Image
            src="https://placehold.co/1200x200/1c3b71/ffffff?text=Khuyến+mãi"
            alt="Banner khuyến mãi"
            width={1200}
            height={200}
            unoptimized
            className="w-full h-auto rounded-xl object-cover"
          />
        </Link>
        <ProductsByCategory />
      </div>
    </>
  )
}
