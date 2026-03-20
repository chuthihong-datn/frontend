'use client'

import { User, ClipboardList, Tag, LogOut, Edit3, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatPrice, formatDate } from '@/lib/utils'
import Pagination from '@/components/shared/Pagination'

const MOCK_ORDERS = [
  { id: '#FOOD-12345', date: '10/05/2023', status: 'shipping', total: 315000 },
  { id: '#FOOD-12340', date: '18/10/2023', status: 'delivered', total: 210000 },
  { id: '#FOOD-12345', date: '25/10/2023', status: 'delivered', total: 188000 },
  { id: '#FOOD-12340', date: '14/05/2023', status: 'delivered', total: 210000 },
]

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  shipping: { label: 'Đang giao', class: 'status-shipping' },
  delivered: { label: 'Hoàn thành', class: 'status-delivered' },
  cancelled: { label: 'Đã hủy', class: 'status-cancelled' },
}

const SIDEBAR_ITEMS = [
  { id: 'orders', label: 'Lịch sử đặt hàng', icon: ClipboardList },
  { id: 'vouchers', label: 'Voucher của tôi', icon: Tag },
]

export default function ProfilePage() {
  const { user, logout } = useAuthStore()

  return (
    <div className="container-page py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-5">
            {/* Avatar */}
            <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-lg">
                    {(user?.name ?? 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-secondary-900 truncate">{user?.name ?? 'Người dùng'}</p>
                <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-secondary-700 hover:bg-secondary-100 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-red-50 transition-colors mt-2"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </nav>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Header */}
          <div className="card p-6 flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center">
              <span className="text-primary font-bold text-3xl">
                {(user?.name ?? 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-secondary-900">{user?.name}</h2>
              <p className="text-secondary-500 text-sm mt-1">✉️ {user?.email}</p>
              {user?.phone && <p className="text-secondary-500 text-sm">📞 {user.phone}</p>}
            </div>
            <button className="btn-primary btn-md flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa hồ sơ
            </button>
          </div>

          {/* Order History */}
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
