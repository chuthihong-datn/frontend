'use client'

import { Bell, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'

const routeTitles: Record<string, string> = {
  '/dashboard': '',
  '/categories': '',
  '/menus': '',
  '/topping': '',
  '/delivery-addresses': '',
  '/orders': '',
  '/products': '',
  '/promotions': '',
  '/reviews': '',
  '/accounts': '',
}

export default function AdminHeader() {
  const pathname = usePathname()
  const title = Object.entries(routeTitles).find(([route]) =>
    pathname.startsWith(route)
  )?.[1] ?? 'Admin'

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-display font-semibold text-secondary-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative">
        </div>
        <button className="relative p-2 hover:bg-secondary-50 rounded-xl">
          <Bell className="w-5 h-5 text-secondary-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">A</span>
        </div>
      </div>
    </header>
  )
}
