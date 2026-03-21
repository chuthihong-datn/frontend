'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SortSelectOption {
  value: 'all' | 'price_asc' | 'price_desc' | 'rating'
  label: string
}

interface SortSelectProps {
  options: SortSelectOption[]
}

export default function SortSelect({ options }: SortSelectProps) {
  const router = useRouter()
  const params = useSearchParams()
  const activeSort = params.get('sort') ?? 'all'

  const handleChange = (value: string) => {
    const current = new URLSearchParams(params.toString())

    if (value === 'all') {
      current.delete('sort')
    } else {
      current.set('sort', value)
    }

    current.delete('page')
    router.push(`/menu?${current.toString()}`)
  }

  return (
    <select
      value={activeSort}
      onChange={(e) => handleChange(e.target.value)}
      className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:border-primary"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
