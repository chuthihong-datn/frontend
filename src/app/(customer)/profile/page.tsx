'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ClipboardList, Tag, LogOut, Edit3, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import EditProfileModal from '@/components/customer/profile/EditProfileModal'
import { toast } from 'sonner'
import { getProfile, getMyOrderDetail, getMyOrders } from '@/api/user'
import type { OrderByUserResponse } from '@/types'

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'Chờ xác nhận', class: 'status-pending' },
  CONFIRMED: { label: 'Đã xác nhận', class: 'status-confirmed' },
  DELIVERING: { label: 'Đang giao', class: 'status-shipping' },
  COMPLETED: { label: 'Hoàn thành', class: 'status-delivered' },
  CANCELLED: { label: 'Đã hủy', class: 'status-cancelled' },
}

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'Thông tin cá nhân', icon: User, href: '/profile' },
  { id: 'orders', label: 'Lịch sử đặt hàng', icon: ClipboardList, href: '/profile/orders' },
  { id: 'vouchers', label: 'Voucher của tôi', icon: Tag, href: '/profile/my-voucher' },
]

export default function ProfilePage() {
  const { user, logout, setUser, accessToken } = useAuthStore()
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [orders, setOrders] = useState<OrderByUserResponse[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)
  const [isLoadingOrderDetail, setIsLoadingOrderDetail] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderByUserResponse | null>(null)
  const userRole = user?.role ?? 'customer'
  const fallbackCreatedAt = user?.createdAt ?? new Date().toISOString()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const formatOrderDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return dateString
    }
  }

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) return
      try {
        const profile = await getProfile()
        setUser(
          {
            id: Number(profile.accountId),
            name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            avtUrl: profile.avtUrl,
            role: userRole,
            createdAt: profile.createdAt ?? fallbackCreatedAt,
          },
          accessToken
        )
      } catch (error: any) {
        console.error('Error fetching profile:', error)
        // Silently fail - user data is already in store
      }
    }

    fetchProfile()
  }, [accessToken, fallbackCreatedAt, setUser, userRole])

  // Fetch orders data on mount
  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true)
      try {
        const myOrders = await getMyOrders()
        setOrders(myOrders)
      } catch (error: any) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } finally {
        setLoadingOrders(false)
      }
    }

    if (accessToken) {
      fetchOrders()
    }
  }, [accessToken])

  const handleViewOrderDetail = async (orderId: number | string) => {
    setIsOrderDetailOpen(true)
    setIsLoadingOrderDetail(true)

    try {
      const detail = await getMyOrderDetail(orderId)
      setSelectedOrderDetail(detail)
    } catch (error: any) {
      setIsOrderDetailOpen(false)
      toast.error(error?.response?.data?.message || error?.message || 'Không thể tải chi tiết đơn hàng')
    } finally {
      setIsLoadingOrderDetail(false)
    }
  }

  return (
    <div className="container-page py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
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
                      item.id === 'profile'
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

        {/* Main */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Header */}
          <div className="card p-6 flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center">
              {user?.avtUrl ? (
                <img src={user.avtUrl} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-primary font-bold text-3xl">
                  {(user?.name ?? 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-2xl text-secondary-900">{user?.name}</h2>
              <p className="text-secondary-500 text-sm mt-1">✉️ {user?.email}</p>
              {user?.phone && <p className="text-secondary-500 text-sm">📞 {user.phone}</p>}
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-primary btn-md flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa hồ sơ
            </button>
          </div>

          {/* Order History */}
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-semibold text-secondary-900">Đơn đặt gần đây</h2>
              <Link href="/profile/orders" className="text-primary text-sm font-medium hover:underline">
                Xem tất cả
              </Link>
            </div>
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
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-secondary-500">
                        Đang tải đơn hàng...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-secondary-500">
                        Không có đơn hàng
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map((order) => (
                      <tr key={order.orderId} className="border-b border-border last:border-0 hover:bg-secondary-50 transition-colors">
                        <td className="py-3 px-2 font-mono font-semibold text-secondary-900">#{order.orderId}</td>
                        <td className="py-3 px-2 text-secondary-600">{formatOrderDate(order.createdAt)}</td>
                        <td className="py-3 px-2">
                          <span className={STATUS_MAP[order.orderStatus]?.class ?? 'badge'}>
                            {STATUS_MAP[order.orderStatus]?.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-semibold text-primary">{formatPrice(order.finalAmount)}</td>
                        <td className="py-3 px-2">
                          <button
                            type="button"
                            onClick={() => handleViewOrderDetail(order.orderId)}
                            className="text-primary hover:underline text-xs font-medium"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isOrderDetailOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary-900">
                Chi tiết đơn #{selectedOrderDetail?.orderId ?? '--'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsOrderDetailOpen(false)
                  setSelectedOrderDetail(null)
                }}
                className="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
              {isLoadingOrderDetail ? (
                <p className="text-sm text-secondary-500">Đang tải chi tiết đơn hàng...</p>
              ) : !selectedOrderDetail ? (
                <p className="text-sm text-secondary-500">Không có dữ liệu chi tiết đơn hàng.</p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-secondary-50 p-3">
                      <p className="text-secondary-500">Địa chỉ</p>
                      <p className="font-medium text-secondary-900 mt-1">{selectedOrderDetail.address}</p>
                      <p className="text-secondary-600 mt-1">{selectedOrderDetail.wardName}</p>
                    </div>
                    <div className="rounded-xl bg-secondary-50 p-3">
                      <p className="text-secondary-500">Thanh toán</p>
                      <p className="font-medium text-secondary-900 mt-1">{selectedOrderDetail.paymentStatus}</p>
                      <p className="text-secondary-600 mt-1">{formatOrderDate(selectedOrderDetail.createdAt)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-secondary-50 border-b border-border">
                      <p className="font-semibold text-secondary-900">Món đã đặt</p>
                    </div>
                    <div className="divide-y divide-border">
                      {selectedOrderDetail.items.map((item, index) => (
                        <div key={`${item.menuName}-${index}`} className="px-4 py-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-secondary-900">{item.menuName}</p>
                              {item.sizeName && <p className="text-secondary-500 text-xs mt-0.5">Size: {item.sizeName}</p>}
                              {item.toppings.length > 0 && (
                                <p className="text-secondary-500 text-xs mt-0.5">
                                  Topping: {item.toppings.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-secondary-600">x{item.quantity}</p>
                              <p className="font-semibold text-primary mt-0.5">{formatPrice(item.itemTotal)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-secondary-50 p-4 text-sm space-y-2">
                    <div className="flex justify-between text-secondary-700">
                      <span>Tạm tính</span>
                      <span>{formatPrice(selectedOrderDetail.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-secondary-700">
                      <span>Phí giao hàng</span>
                      <span>{formatPrice(selectedOrderDetail.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-secondary-900 font-bold border-t border-border pt-2">
                      <span>Tổng thanh toán</span>
                      <span className="text-primary">{formatPrice(selectedOrderDetail.finalAmount)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          // Refetch profile after successful update
          setIsEditModalOpen(false)
        }}
      />
    </div>
  )
}
