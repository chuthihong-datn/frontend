import HeroBanner from '@/components/customer/home/HeroBanner'
import CategorySection from '@/components/customer/home/CategorySection'
import FeaturedProducts from '@/components/customer/home/FeaturedProducts'

export default function HomePage() {
  return (
    <div>
      <HeroBanner />
      <CategorySection />
      <FeaturedProducts />
    </div>
  )
}
