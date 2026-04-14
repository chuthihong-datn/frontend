import { getMenusApi } from '@/api/menu'
import FeaturedProductsRail from '@/components/customer/home/FeaturedProductsRail'

export default async function FeaturedProducts() {
  const featuredProducts = (await getMenusApi())
    .filter((product) => Number(product.totalSold ?? 0) > 0)
    .sort((firstProduct, secondProduct) => Number(secondProduct.totalSold ?? 0) - Number(firstProduct.totalSold ?? 0))
    .slice(0, 10)

  if (featuredProducts.length === 0) {
    return null
  }

  return <FeaturedProductsRail products={featuredProducts} />
}
