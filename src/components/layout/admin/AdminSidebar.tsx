'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Shapes,
  UtensilsCrossed,
  Sandwich,
  MapPinned,
  ClipboardList,
  TicketPercent,
  Star,
  Users,
  ChevronLeft,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/categories', label: 'Quản lý danh mục', icon: Shapes },
  { href: '/menus', label: 'Quản lý món ăn', icon: UtensilsCrossed },
  { href: '/toppings', label: 'Quản lý topping', icon: Sandwich },
  { href: '/delivery-addresses', label: 'Quản lý địa chỉ giao hàng', icon: MapPinned },
  { href: '/orders', label: 'Quản lý đơn hàng', icon: ClipboardList },
  { href: '/vouchers', label: 'Quản lý khuyến mãi & Voucher', icon: TicketPercent },
  { href: '/reviews', label: 'Quản lý đánh giá', icon: Star },
  { href: '/accounts', label: 'Quản lý tài khoản', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'bg-secondary-900 text-secondary-300 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-primary text-lg">🍴</span>
            <span className="font-display font-bold text-white text-sm">FoodyAdmin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-secondary-700 rounded-lg transition-colors ml-auto"
        >
          <ChevronLeft
            className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary-400 hover:bg-secondary-700 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-secondary-700">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-secondary-400 truncate">admin@foody.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
