'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ClipboardList, Tag, LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { getMyOrderDetail, getMyOrders } from '@/api/user'
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

export default function OrderHistoryPage() {
  const { logout, accessToken } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderByUserResponse[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)
  const [isLoadingOrderDetail, setIsLoadingOrderDetail] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderByUserResponse | null>(null)
  const itemsPerPage = 10

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

  // Fetch orders on mount
  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true)
      try {
        const myOrders = await getMyOrders()
        setOrders(myOrders)
        setCurrentPage(1)
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

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') {
      return orders
    }
    return orders.filter((order) => order.orderStatus === statusFilter)
  }, [orders, statusFilter])

  // Paginate filtered orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredOrders, currentPage])

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    setCurrentPage(page)
  }

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

            {/* Status Filter */}
            <div className="mb-6 flex items-center gap-3">
              <label className="text-sm font-medium text-secondary-700">Lọc theo trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input-field px-3 py-2 text-sm border rounded-lg"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="DELIVERING">Đang giao</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            {loadingOrders ? (
              <div className="py-8 text-center text-secondary-500">Đang tải đơn hàng...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-secondary-500">Không có đơn hàng</div>
            ) : (
              <>
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
                      {paginatedOrders.map((order) => (
                        <tr key={order.orderId} className="border-b border-border last:border-0 hover:bg-secondary-50 transition-colors">
                          <td className="py-3 px-2 font-mono font-semibold text-secondary-900">#{order.orderId}</td>
                          <td className="py-3 px-2 text-secondary-600">{formatOrderDate(order.createdAt)}</td>
                          <td className="py-3 px-2">
                            <span className={STATUS_MAP[order.orderStatus]?.class ?? 'badge'}>
                              {STATUS_MAP[order.orderStatus]?.label || order.orderStatus}
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
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-secondary-600">
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, filteredOrders.length)} trong {filteredOrders.length} đơn hàng
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === 1
                          ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page number buttons */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                        const pageNum = index + 1
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageClick(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-primary text-white'
                                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      {totalPages > 5 && (
                        <span className="px-2 py-1 text-secondary-500">...</span>
                      )}
                      {totalPages > 5 && (
                        <button
                          onClick={() => handlePageClick(totalPages)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === totalPages
                              ? 'bg-primary text-white'
                              : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                          }`}
                        >
                          {totalPages}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
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
    </div>
  )
}
