import Link from 'next/link'
import { getCategoriesApi } from '@/api/category'

const FALLBACK_ICON =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'

function resolveCategoryIcon(iconUrl: string): string {
  const value = iconUrl?.trim()

  if (!value) {
    return FALLBACK_ICON
  }

  try {
    return new URL(value, 'http://localhost:1503/').toString()
  } catch {
    return FALLBACK_ICON
  }
}

export default async function CategorySection() {
  const categories = await getCategoriesApi()

  return (
    <section className="container-page py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Danh mục món ăn</h2>
        <Link href="/menu" className="text-sm text-primary font-medium hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/menu?category=${cat.id}`}
            className="card flex flex-col items-center gap-2 py-6 hover:shadow-card-hover hover:shadow-primary/30
              border border-transparent transition-all text-center group"
          >
            <span className="group-hover:scale-110 transition-all w-16 h-16 bg-primary-50 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src={resolveCategoryIcon(cat.iconUrl)}
                alt={cat.name}
                className="w-full h-full object-cover"
              />
            </span>
            <span className="text-xl font-medium text-secondary-700 group-hover:text-primary transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
