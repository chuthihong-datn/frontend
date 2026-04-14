import HeroBanner from '@/components/customer/home/HeroBanner'
import CategorySection from '@/components/customer/home/CategorySection'
import FeaturedProducts from '@/components/customer/home/FeaturedProducts'
import FlashSaleProduct from '@/components/customer/home/FlashSaleProduct'

export default function HomePage() {
  return (
    <div>
      <HeroBanner />
      <CategorySection />
      <FlashSaleProduct />
      <FeaturedProducts />
    </div>
  )
}
