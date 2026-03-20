'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { CakeSlice, ChefHat, CookingPot, Martini, Soup } from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'Tất cả món', icon: <ChefHat /> },
  { id: 'pho-bun', label: 'Phở & Bún', icon: <Soup /> },
  { id: 'com-van-phong', label: 'Cơm văn phòng', icon: <CookingPot /> },
  { id: 'mon-an-nhanh', label: 'Món ăn nhanh', icon: <CakeSlice /> },
  { id: 'do-uong', label: 'Đồ uống', icon: <Martini /> },
]

const PRICE_RANGES = [
  { label: 'Dưới 50k', min: 0, max: 50000 },
  { label: '50k – 100k', min: 50000, max: 100000 },
  { label: '100k – 200k', min: 100000, max: 200000 },
  { label: 'Trên 200k', min: 200000, max: 99999999 },
]

interface MenuFilterProps {
  searchParams: {
    category?: string
    minPrice?: string
    maxPrice?: string
  }
}

export default function MenuFilter({ searchParams }: MenuFilterProps) {
  const router = useRouter()
  const params = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const current = new URLSearchParams(params.toString())
      if (value === null) {
        current.delete(key)
      } else {
        current.set(key, value)
      }
      current.delete('page')
      router.push(`/menu?${current.toString()}`)
    },
    [params, router]
  )

  const activeCategory = searchParams.category ?? 'all'
  const activeMin = searchParams.minPrice
  const activeMax = searchParams.maxPrice

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm text-secondary-900 mb-3">Danh mục</h3>
        <ul className="space-y-1">
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => setParam('category', cat.id === 'all' ? null : cat.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all',
                  activeCategory === cat.id
                    ? 'bg-primary text-white font-medium'
                    : 'text-secondary-700 hover:bg-secondary-100'
                )}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-sm text-secondary-900 mb-3">Mức giá</h3>
        <ul className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isActive =
              activeMin === String(range.min) && activeMax === String(range.max)
            return (
              <li key={range.label}>
                <button
                  onClick={() => {
                    if (isActive) {
                      setParam('minPrice', null)
                      setParam('maxPrice', null)
                    } else {
                      setParam('minPrice', String(range.min))
                      setParam('maxPrice', String(range.max))
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left"
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                      isActive ? 'border-primary bg-primary' : 'border-secondary-300'
                    )}
                  >
                    {isActive && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5L2 5.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className={cn('text-secondary-700', isActive && 'text-primary font-medium')}>
                    {range.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
