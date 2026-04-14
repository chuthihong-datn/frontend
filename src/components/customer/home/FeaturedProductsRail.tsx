'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ProductCard from '@/components/customer/menu/ProductCard'
import type { Product } from '@/types'

const MAX_HOT_ITEMS = 10
const STEP = 4
const VISIBLE_COUNT = 4

interface FeaturedProductsRailProps {
  products: Product[]
  title?: string
  flashSaleEndTime?: string | null
}

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export default function FeaturedProductsRail({
  products,
  title = 'Món ăn nổi bật',
  flashSaleEndTime = null,
}: FeaturedProductsRailProps) {
  const hotProducts = products.slice(0, MAX_HOT_ITEMS)
  const [startIndex, setStartIndex] = useState(0)
  const [countdown, setCountdown] = useState('00 : 00 : 00')
  const maxStartIndex = Math.max(
    0,
    Math.floor((Math.max(hotProducts.length, 1) - 1) / VISIBLE_COUNT) * VISIBLE_COUNT
  )

  useEffect(() => {
    if (!flashSaleEndTime) {
      setCountdown('00 : 00 : 00')
      return
    }

    const endTime = new Date(flashSaleEndTime)

    const updateCountdown = () => {
      const remainingSeconds = Math.floor((endTime.getTime() - Date.now()) / 1000)
      setCountdown(formatCountdown(remainingSeconds))
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)

    return () => window.clearInterval(intervalId)
  }, [flashSaleEndTime])

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold">{title}</h2>

          {flashSaleEndTime && (
            <div className="inline-flex items-center gap-1">
              {countdown.split(':').map((segment, index) => (
                <div key={`${segment}-${index}`} className="inline-flex items-center gap-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-orange-300 bg-primary px-1 font-mono text-xs font-bold text-white shadow-sm">
                    {segment}
                  </span>
                  {index < 2 && <span className="text-lg font-bold text-primary">:</span>}
                </div>
              ))}
            </div>
          )}
        </div>

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
