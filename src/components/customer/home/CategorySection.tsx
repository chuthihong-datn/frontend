import { Pizza, Hamburger, Martini, FishSymbol } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { id: '1', name: 'Pizza', icon: <Pizza size={32}/>, slug: 'pizza' },
  { id: '2', name: 'Burger', icon: <Hamburger size={32}/>, slug: 'burger' },
  { id: '3', name: 'Sushi', icon: <FishSymbol size={32} />, slug: 'sushi' },
  { id: '4', name: 'Đồ uống', icon: <Martini size={32} />, slug: 'do-uong' },
]

export default function CategorySection() {
  return (
    <section className="container-page py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Danh mục món ăn</h2>
        <Link href="/menu" className="text-sm text-primary font-medium hover:underline">
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/menu?category=${cat.slug}`}
            className="card flex flex-col items-center gap-2 py-6 hover:shadow-card-hover hover:shadow-primary/30
              border border-transparent transition-all text-center group"
          >
            <span className="group-hover:scale-110 text-primary transition-all p-5 bg-primary-50 rounded-full">{cat.icon}</span>
            <span className="text-xl font-medium text-secondary-700 group-hover:text-primary transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
