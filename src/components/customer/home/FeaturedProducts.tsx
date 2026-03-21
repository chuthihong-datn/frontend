import { getHotMenusApi } from '@/api/menu'
import FeaturedProductsRail from '@/components/customer/home/FeaturedProductsRail'

export default async function FeaturedProducts() {
  const featuredProducts = await getHotMenusApi()

  return <FeaturedProductsRail products={featuredProducts} />
}
