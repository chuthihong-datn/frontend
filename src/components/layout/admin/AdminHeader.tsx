'use client'

import { Bell, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Quản lý đơn hàng',
  '/products': 'Quản lý sản phẩm',
  '/users': 'Quản lý người dùng',
  '/vouchers': 'Quản lý Voucher',
  '/analytics': 'Phân tích dữ liệu',
  '/settings': 'Cài đặt hệ thống',
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            placeholder="Tìm kiếm..."
            className="pl-9 pr-4 py-2 text-sm bg-secondary-50 rounded-xl border border-transparent 
              focus:outline-none focus:border-primary/30 w-48"
          />
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
