import type { Metadata } from 'next'
import MenuDetail from '@/components/customer/menu/MenuDetail'

interface MenuDetailPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: 'Chi Tiết Sản Phẩm - FoodieDelivery',
  description: 'Xem chi tiết món ăn và đặt hàng',
}

export default function MenuDetailPage({ params }: MenuDetailPageProps) {
  const productId = parseInt(params.id, 10)

  if (isNaN(productId)) {
    return (
      <div className="container-page py-8">
        <p className="text-center text-secondary-500">ID sản phẩm không hợp lệ</p>
      </div>
    )
  }

  return <MenuDetail productId={productId} />
}
