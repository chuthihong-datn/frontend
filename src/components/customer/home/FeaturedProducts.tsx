import Link from 'next/link'
import ProductCard from '@/components/customer/menu/ProductCard'
import type { Product } from '@/types'

// Mock data — replace with API call
const FEATURED: Product[] = [
  {
    id: '1',
    name: 'Double Cheeseburger',
    slug: 'double-cheeseburger',
    description: 'Burger bò phô mai đôi với rau sống tươi ngon',
    price: 125000,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    category: { id: '2', name: 'Burger', slug: 'burger' },
    rating: 4.8,
    reviewCount: 234,
    isAvailable: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Salmon Sushi Set',
    slug: 'salmon-sushi-set',
    description: 'Set sushi cá hồi tươi ngon kèm wasabi',
    price: 210000,
    image: 'https://images.unsplash.com/photo-1617196034738-26f5b8a3e7a6?w=400',
    category: { id: '3', name: 'Sushi', slug: 'sushi' },
    rating: 4.9,
    reviewCount: 180,
    isAvailable: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Seafood Supreme Pizza',
    slug: 'seafood-supreme-pizza',
    description: 'Pizza hải sản cao cấp với tôm, mực, nghêu',
    price: 185000,
    originalPrice: 231000,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    category: { id: '1', name: 'Pizza', slug: 'pizza' },
    rating: 4.7,
    reviewCount: 312,
    isAvailable: true,
    isFeatured: true,
    badge: 'sale',
    discount: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default function FeaturedProducts() {
  return (
    <section className="container-page py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Món ăn nổi bật</h2>
        <Link href="/menu" className="text-sm text-primary font-medium hover:underline">
          Xem thêm
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {FEATURED.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
