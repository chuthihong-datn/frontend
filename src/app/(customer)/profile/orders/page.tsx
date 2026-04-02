'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ClipboardList, Tag, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import Pagination from '@/components/shared/Pagination'

const MOCK_ORDERS = [
  { id: '#FOOD-12345', date: '10/05/2023', status: 'shipping', total: 315000 },
  { id: '#FOOD-12340', date: '18/10/2023', status: 'delivered', total: 210000 },
  { id: '#FOOD-12339', date: '16/10/2023', status: 'delivered', total: 189000 },
  { id: '#FOOD-12338', date: '11/10/2023', status: 'cancelled', total: 99000 },
  { id: '#FOOD-12337', date: '09/10/2023', status: 'delivered', total: 125000 },
  { id: '#FOOD-12336', date: '08/10/2023', status: 'shipping', total: 450000 },
  { id: '#FOOD-12335', date: '06/10/2023', status: 'delivered', total: 225000 },
  { id: '#FOOD-12334', date: '04/10/2023', status: 'delivered', total: 78000 },
  { id: '#FOOD-12333', date: '02/10/2023', status: 'cancelled', total: 133000 },
  { id: '#FOOD-12332', date: '01/10/2023', status: 'delivered', total: 205000 },
]

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  shipping: { label: 'Đang giao', class: 'status-shipping' },
  delivered: { label: 'Hoàn thành', class: 'status-delivered' },
  cancelled: { label: 'Đã hủy', class: 'status-cancelled' },
}

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'Thông tin cá nhân', icon: User, href: '/profile' },
  { id: 'orders', label: 'Lịch sử đặt hàng', icon: ClipboardList, href: '/profile/orders' },
  { id: 'vouchers', label: 'Voucher của tôi', icon: Tag, href: '/voucher' },
]

export default function OrderHistoryPage() {
  const { logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="container-page py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="card p-5">
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      item.id === 'orders'
                        ? 'bg-primary-50 text-primary font-medium'
                        : 'text-secondary-700 hover:bg-secondary-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-red-50 transition-colors mt-2"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card p-6">
            <h2 className="font-semibold text-secondary-900 mb-5">Lịch sử đặt hàng</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Mã đơn hàng', 'Ngày đặt', 'Trạng thái', 'Tổng tiền', 'Thao tác'].map((h) => (
                      <th key={h} className="text-left py-3 px-2 text-secondary-500 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ORDERS.map((order, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-2 font-mono font-semibold text-secondary-900">{order.id}</td>
                      <td className="py-3 px-2 text-secondary-600">{order.date}</td>
                      <td className="py-3 px-2">
                        <span className={STATUS_MAP[order.status]?.class ?? 'badge'}>
                          {STATUS_MAP[order.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-primary">{formatPrice(order.total)}</td>
                      <td className="py-3 px-2">
                        <button className="text-primary hover:underline text-xs font-medium">Xem</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <Pagination page={1} totalPages={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
