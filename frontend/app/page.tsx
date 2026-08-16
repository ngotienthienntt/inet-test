import HeroBanner from '@/components/home/HeroBanner'
import CategoryGrid from '@/components/home/CategoryGrid'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import ProductsByCategory from '@/components/home/ProductsByCategory'
import PromoBanner from '@/components/home/PromoBanner'

export default function Home() {
  return (
    <>
      <HeroBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <CategoryGrid />
        <FeaturedProducts />
        <PromoBanner position="homepage_before_categories" />
        <ProductsByCategory />
      </div>
    </>
  )
}
