'use client'

import { Bell, LogOut } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

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
  const router = useRouter()
  const { logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const title = Object.entries(routeTitles).find(([route]) =>
    pathname.startsWith(route)
  )?.[1] ?? 'Admin'

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return
      }

      const target = event.target as Node | null
      if (target && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

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
        <div
          className="relative"
          ref={userMenuRef}
        >
          <button
            type="button"
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center hover:bg-primary-200 transition-colors"
            title="Tài khoản admin"
          >
            <span className="text-primary font-bold text-sm">A</span>
          </button>

          <div
            className={cn(
              'absolute right-0 top-10 z-20 min-w-[140px] rounded-xl border border-border bg-white p-1 shadow-lg transition-all',
              showUserMenu ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
            )}
          >
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
