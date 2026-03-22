import ProductCard from './ProductCard'
import Pagination from '@/components/shared/Pagination'
import { getMenusApi, getMenusByCategoryApi, searchMenusApi } from '@/api/menu'
import SortSelect from '@/components/customer/menu/SortSelect'
import type { Product } from '@/types'

interface MenuGridProps {
  searchParams: {
    search?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    page?: string
  }
}

const SORT_OPTIONS = [
  { value: 'all', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao' },
] as const

export default async function MenuGrid({ searchParams }: MenuGridProps) {
  const categoryId = Number(searchParams.category)
  const minPrice = Number(searchParams.minPrice)
  const maxPrice = Number(searchParams.maxPrice)
  const searchKeyword = searchParams.search ?? ''
  
  const hasValidCategory = Number.isFinite(categoryId) && categoryId > 0
  const hasMinPrice = Number.isFinite(minPrice)
  const hasMaxPrice = Number.isFinite(maxPrice)
  
  // Fetch menus based on search or category
  let menus: Product[] = []
  if (searchKeyword.trim()) {
    menus = await searchMenusApi(searchKeyword)
  } else if (hasValidCategory) {
    menus = await getMenusByCategoryApi(categoryId)
  } else {
    menus = await getMenusApi()
  }
  
  const page = Number(searchParams.page ?? 1)
  const limit = 9

  const filteredMenus = menus.filter((menu) => {
    if (hasMinPrice && menu.minPrice < minPrice) {
      return false
    }

    if (hasMaxPrice && menu.minPrice > maxPrice) {
      return false
    }

    return true
  })

  const sortType = searchParams.sort ?? 'all'
  const sortedMenus = [...filteredMenus].sort((a, b) => {
    switch (sortType) {
      case 'price_asc':
        return a.minPrice - b.minPrice
      case 'price_desc':
        return b.minPrice - a.minPrice
      case 'rating':
        return b.rating - a.rating
      case 'all':
      default:
        return 0
    }
  })

  const totalItems = sortedMenus.length
  const safePage = Math.min(Math.max(page, 1), Math.max(1, Math.ceil(totalItems / limit)))
  const startIndex = (safePage - 1) * limit
  const endIndex = startIndex + limit
  const currentPageItems = sortedMenus.slice(startIndex, endIndex)
  const from = totalItems === 0 ? 0 : startIndex + 1
  const to = Math.min(endIndex, totalItems)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          {searchKeyword && (
            <p className="text-sm text-secondary-500 mb-2">
              Kết quả tìm kiếm cho: <strong className="text-primary">"{searchKeyword}"</strong>
            </p>
          )}
          <p className="text-sm text-secondary-500">
            Hiển thị <strong className="text-secondary-900">{from}–{to}</strong> trong{' '}
            <strong className="text-secondary-900">{totalItems}</strong> món ăn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary-500">Sắp xếp:</span>
          <SortSelect options={[...SORT_OPTIONS]} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {currentPageItems.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8">
        <Pagination page={safePage} totalPages={Math.ceil(totalItems / limit) || 1} />
      </div>
    </div>
  )
}
