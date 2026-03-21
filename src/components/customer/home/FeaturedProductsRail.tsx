'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ProductCard from '@/components/customer/menu/ProductCard'
import type { Product } from '@/types'

const MAX_HOT_ITEMS = 10
const STEP = 4
const VISIBLE_COUNT = 4

interface FeaturedProductsRailProps {
  products: Product[]
}

export default function FeaturedProductsRail({ products }: FeaturedProductsRailProps) {
  const hotProducts = products.slice(0, MAX_HOT_ITEMS)
  const [startIndex, setStartIndex] = useState(0)
  const maxStartIndex = Math.max(
    0,
    Math.floor((Math.max(hotProducts.length, 1) - 1) / VISIBLE_COUNT) * VISIBLE_COUNT
  )

  const canGoPrev = startIndex > 0
  const canShowMore = startIndex < maxStartIndex
  const showViewAll = hotProducts.length === MAX_HOT_ITEMS && !canShowMore
  const visibleProducts = hotProducts.slice(startIndex, startIndex + VISIBLE_COUNT)

  const handleShowPrev = () => {
    setStartIndex((prev) => Math.max(prev - STEP, 0))
  }

  const handleShowMore = () => {
    setStartIndex((prev) => Math.min(prev + STEP, maxStartIndex))
  }

  return (
    <section className="container-page py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Món ăn nổi bật</h2>

        <div className="flex items-center gap-2">
          {canGoPrev && (
            <button
              onClick={handleShowPrev}
              aria-label="Hiển thị món nổi bật trước đó"
              className="w-9 h-9 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {canShowMore && (
            <button
              onClick={handleShowMore}
              aria-label="Hiển thị thêm món nổi bật"
              className="w-9 h-9 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {showViewAll && (
            <Link href="/menu" className="text-sm text-primary font-medium hover:underline">
              Xem tất cả
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} showSoldCount />
        ))}
      </div>
    </section>
  )
}
