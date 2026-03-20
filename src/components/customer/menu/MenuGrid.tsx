import ProductCard from './ProductCard'
import Pagination from '@/components/shared/Pagination'
import type { Product } from '@/types'

// In production, fetch from API based on searchParams
const MOCK_PRODUCTS: Product[] = Array.from({ length: 9 }, (_, i) => ({
  id: String(i + 1),
  name: ['Bún Chả Hà Nội Đặc Biệt', 'Phở Bò Tái Lăn', 'Cơm Sườn Nướng Muối Ớt',
         'Combo Sushi Tổng Hợp', 'Cheese Burger Bò Mỹ', 'Cà Phê Sữa Đá Sài Gòn',
         'Mì Cay Hải Sản', 'Bún Bò Huế', 'Gà Nướng Sa Tế'][i],
  slug: `product-${i + 1}`,
  description: 'Món ăn đặc sắc với hương vị đậm đà',
  price: [65000, 55000, 45000, 120000, 89000, 29000, 75000, 60000, 95000][i],
  originalPrice: i % 3 === 1 ? [65000, 75000, 55000, 150000, 110000, 35000, 90000, 75000, 120000][i] : undefined,
  image: [
    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400',
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
    'https://images.unsplash.com/photo-1617196034738-26f5b8a3e7a6?w=400',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400',
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400',
  ][i],
  category: { id: '1', name: 'Tất cả', slug: 'all' },
  rating: [4.5, 4.3, 4.7, 4.8, 4.6, 4.9, 4.4, 4.2, 4.7][i],
  reviewCount: [120, 89, 234, 156, 98, 312, 75, 44, 189][i],
  isAvailable: true,
  badge: i === 0 ? 'new' : i === 3 ? 'hot' : i % 3 === 1 ? 'sale' : undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

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

export default function MenuGrid({ searchParams }: MenuGridProps) {
  const totalItems = 48
  const page = Number(searchParams.page ?? 1)
  const limit = 9

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-secondary-500">
          Hiển thị <strong className="text-secondary-900">1–{limit}</strong> trong{' '}
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
        {MOCK_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8">
        <Pagination page={page} totalPages={Math.ceil(totalItems / limit)} />
      </div>
    </div>
  )
}
