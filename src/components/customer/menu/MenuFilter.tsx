'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

const PRICE_RANGES = [
  { label: 'Dưới 50k', min: 0, max: 50000 },
  { label: '50k – 100k', min: 50000, max: 100000 },
  { label: 'trên 100k', min: 100000, max: 99999999 },
]

interface MenuFilterProps {
  categories: Category[]
}

export default function MenuFilter({ categories }: MenuFilterProps) {
  const router = useRouter()
  const params = useSearchParams()
  
  // Khi có search keyword, không highlight category nào
  const currentSearch = params.get('search')
  const activeCategory = currentSearch ? null : (params.get('category') ?? 'all')
  const activeMin = params.get('minPrice')
  const activeMax = params.get('maxPrice')

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(params.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          current.delete(key)
          return
        }

        current.set(key, value)
      })

      current.delete('page')
      router.push(`/menu?${current.toString()}`)
    },
    [params, router]
  )
  const categoryOptions = [
    { id: 'all', label: 'Tất cả món' },
    ...categories.map((cat) => ({ id: String(cat.id), label: cat.name })),
  ]

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm text-secondary-900 mb-3">Danh mục</h3>
        <ul className="space-y-1">
          {categoryOptions.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => {
                  // Chỉ xóa search khi chuyển sang danh mục khác
                  if (cat.id === activeCategory) {
                    return
                  }
                  setParams({ 
                    category: cat.id === 'all' ? null : cat.id,
                    search: null,
                    minPrice: null,
                    maxPrice: null
                  })
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all',
                  activeCategory === cat.id
                    ? 'bg-primary text-white font-medium'
                    : 'text-secondary-700 hover:bg-secondary-100'
                )}
              >
                <span>{cat.label}</span>
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
                      // Bỏ filter giá - không xóa search, chỉ bỏ minPrice/maxPrice
                      setParams({ minPrice: null, maxPrice: null })
                    } else {
                      // Áp dụng filter giá - giữ search keyword
                      setParams({
                        minPrice: String(range.min),
                        maxPrice: String(range.max),
                      })
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
