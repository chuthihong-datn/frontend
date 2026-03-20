'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { formatPrice, calcDiscountPercent } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`)
  }

  const discountPercent = product.originalPrice
    ? calcDiscountPercent(product.originalPrice, product.price)
    : 0

  return (
    <Link href={`/menu/${product.id}`} className={cn('block group', className)}>
      <div className="card-hover overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Badge */}
          {product.badge && (
            <span
              className={cn(
                'absolute top-2 left-2 badge',
                product.badge === 'new' && 'badge-new',
                product.badge === 'sale' && 'badge-sale',
                product.badge === 'hot' && 'badge-hot'
              )}
            >
              {product.badge === 'new' ? 'Mới' : product.badge === 'sale' ? `${discountPercent}%` : 'Hot'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-secondary-900 line-clamp-1 mb-1">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="text-xs text-secondary-600">
              {product.rating} ({product.reviewCount})
            </span>
          </div>

          {/* Price + Add */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-primary text-sm">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="ml-1.5 text-xs text-secondary-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center 
                hover:bg-primary-600 active:scale-90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
