import type { Metadata } from 'next'
import MenuFilter from '@/components/customer/menu/MenuFilter'
import MenuGrid from '@/components/customer/menu/MenuGrid'

export const metadata: Metadata = {
  title: 'Thực đơn',
  description: 'Khám phá hàng trăm món ăn ngon được giao tận nơi',
}

interface MenuPageProps {
  searchParams: {
    category?: string
    search?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    page?: string
  }
}

export default function MenuPage({ searchParams }: MenuPageProps) {
  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-secondary-500 mb-4">
        <span>Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="text-secondary-900 font-medium">Thực đơn</span>
      </nav>

      <h1 className="text-3xl font-bold text-secondary-900 mb-1">Thực Đơn Món Ăn</h1>
      <p className="text-secondary-300 mb-8">
        Khám phá hàng trăm món ăn ngon được giao tận nơi
      </p>

      <div className="flex gap-8">
        {/* Sidebar Filter */}
        <aside className="hidden lg:block w-52 shrink-0">
          <MenuFilter searchParams={searchParams} />
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <MenuGrid searchParams={searchParams} />
        </div>
      </div>
    </div>
  )
}
