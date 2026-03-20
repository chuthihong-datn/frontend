'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
}

export default function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter()
  const params = useSearchParams()

  const goToPage = (p: number) => {
    const current = new URLSearchParams(params.toString())
    current.set('page', String(p))
    router.push(`?${current.toString()}`)
  }

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary-100 
          disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => goToPage(p)}
          className={cn(
            'w-8 h-8 rounded-xl text-sm font-medium transition-all',
            p === page
              ? 'bg-primary text-white shadow-sm'
              : 'text-secondary-700 hover:bg-secondary-100'
          )}
        >
          {p}
        </button>
      ))}

      {totalPages > 5 && (
        <>
          <span className="text-secondary-400 px-1">...</span>
          <button
            onClick={() => goToPage(totalPages)}
            className={cn(
              'w-8 h-8 rounded-xl text-sm font-medium transition-all',
              page === totalPages
                ? 'bg-primary text-white'
                : 'text-secondary-700 hover:bg-secondary-100'
            )}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary-100 
          disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
