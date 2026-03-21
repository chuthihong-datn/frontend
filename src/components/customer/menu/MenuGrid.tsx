import ProductCard from './ProductCard'
import Pagination from '@/components/shared/Pagination'
import { getMenusApi } from '@/api/menu'

interface MenuGridProps {
  searchParams: {
    sort?: string
    page?: string
  }
}

const SORT_OPTIONS = [
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao' },
]

export default async function MenuGrid({ searchParams }: MenuGridProps) {
  const menus = await getMenusApi()
  const page = Number(searchParams.page ?? 1)
  const limit = 9

  const sortedMenus = [...menus].sort((a, b) => {
    switch (searchParams.sort) {
      case 'price_asc':
        return a.minPrice - b.minPrice
      case 'price_desc':
        return b.minPrice - a.minPrice
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return b.id - a.id
      case 'popular':
      default:
        return a.id - b.id
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
        <p className="text-sm text-secondary-500">
          Hiển thị <strong className="text-secondary-900">{from}–{to}</strong> trong{' '}
          <strong className="text-secondary-900">{totalItems}</strong> món ăn
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary-500">Sắp xếp:</span>
          <select className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:border-primary">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
