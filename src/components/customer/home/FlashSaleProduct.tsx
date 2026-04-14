import { getMenusApi } from '@/api/menu'
import FeaturedProductsRail from '@/components/customer/home/FeaturedProductsRail'

export default async function FlashSaleProduct() {
	const products = await getMenusApi()
	const flashSaleProducts = products.filter((product) => product.flashSale === true)
	const flashSaleEndTime = flashSaleProducts.find((product) => product.flashSaleEndTime)?.flashSaleEndTime ?? null

	if (!flashSaleProducts.length) {
		return null
	}

	return (
		<FeaturedProductsRail
			products={flashSaleProducts}
			title="Flash Sale"
			flashSaleEndTime={flashSaleEndTime}
		/>
	)
}
