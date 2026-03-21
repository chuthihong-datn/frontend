'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Star, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'

function sanitizeImageSrc(src?: string): string {
  const value = src?.trim()

  if (!value) {
    return FALLBACK_IMAGE
  }

  if (value.startsWith('/')) {
    return value
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? value
      : FALLBACK_IMAGE
  } catch {
    return FALLBACK_IMAGE
  }
}

interface ProductCardProps {
  product: Product
  className?: string
  showSoldCount?: boolean
}

export default function ProductCard({
  product,
  className,
  showSoldCount = false,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const firstImage = sanitizeImageSrc(product.images?.[0])
  const hasRating = Number(product.rating) > 0
  const [imageSrc, setImageSrc] = useState(firstImage)

  useEffect(() => {
    setImageSrc(firstImage)
  }, [firstImage])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`)
  }

  return (
    <Link href={`/menu/${product.id}`} className={cn('block group', className)}>
      <div className="card-hover overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary-100">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            onError={() => setImageSrc(FALLBACK_IMAGE)}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-secondary-900 line-clamp-1 mb-1">
            {product.name}
          </h3>

          {showSoldCount && (
            <p className="text-xs text-secondary-500 mb-1">
              Đã bán: <span className="font-medium text-secondary-700">{product.totalSold ?? 0}</span>
            </p>
          )}

          {/* Rating */}
          <div className={cn('flex items-center gap-1 mb-2', !hasRating && 'invisible')}>
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="text-xs text-secondary-600">
              {product.rating}
            </span>
          </div>

          {/* Price + Add */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-primary text-sm">
                {formatPrice(product.minPrice)}
              </span>
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
