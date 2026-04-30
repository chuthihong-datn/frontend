'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ClipboardList, Tag, LogOut, ChevronLeft, ChevronRight, X, Star, Eye } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { getMyOrderDetail, getMyOrders } from '@/api/user'
import apiClient from '@/lib/api'
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
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [reviewOrderId, setReviewOrderId] = useState<string | number | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewItemsState, setReviewItemsState] = useState<Array<{orderDetailId: number | string | null; menuName: string; rating: number; comment: string}>>([])
  const [isLoadingReviewItems, setIsLoadingReviewItems] = useState(false)
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

  const handleOpenReview = (orderId: number | string) => {
    // Load order detail and prepare per-item review payloads
    setReviewOrderId(orderId)
    setReviewRating(5)
    setReviewComment('')
    setIsLoadingReviewItems(true)

    getMyOrderDetail(orderId)
      .then((detail) => {
        const items = (detail.items || []).map((it: any) => {
          const orderDetailId = (it as any).orderDetailId ?? (it as any).id ?? null
          return {
            orderDetailId,
            menuName: it.menuName || it.productName || 'Món ăn',
            rating: 5,
            comment: '',
          }
        })
        setReviewItemsState(items)
        setIsReviewOpen(true)
      })
      .catch((error: any) => {
        toast.error(error?.response?.data?.message || error?.message || 'Không thể tải thông tin đơn hàng để đánh giá')
      })
      .finally(() => setIsLoadingReviewItems(false))
  }

  const setItemRating = (index: number, rating: number) => {
    setReviewItemsState((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], rating }
      return next
    })
  }

  const setItemComment = (index: number, comment: string) => {
    setReviewItemsState((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], comment }
      return next
    })
  }

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!reviewOrderId) return
    if (reviewItemsState.length === 0) {
      toast.error('Không có mục nào để đánh giá')
      return
    }

    try {
      const payload = {
        orderId: Number(reviewOrderId),
        reviews: reviewItemsState.map((it) => ({
          orderDetailId: it.orderDetailId,
          rating: it.rating,
          comment: it.comment,
        })),
      }

      await apiClient.post('/reviews', payload)

      toast.success('Đánh giá thành công')
      setIsReviewOpen(false)
      setReviewOrderId(null)
      setReviewItemsState([])

      // refresh orders list
      try {
        const myOrders = await getMyOrders()
        setOrders(myOrders)
      } catch (_) {
        // ignore refresh errors
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể gửi đánh giá')
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
                  <table className="w-full table-fixed text-sm">
                    <colgroup>
                      <col className="w-[120px]" />
                      <col className="w-[110px]" />
                      <col className="w-[120px]" />
                      <col className="w-[140px]" />
                      <col className="w-[180px]" />
                    </colgroup>
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
                          <td className="py-3 px-2 font-mono font-semibold text-secondary-900 whitespace-nowrap truncate">#{order.orderId}</td>
                          <td className="py-3 px-2 text-secondary-600">{formatOrderDate(order.createdAt)}</td>
                          <td className="py-3 px-2">
                            <span className={`${STATUS_MAP[order.orderStatus]?.class ?? 'badge'} inline-flex max-w-full items-center justify-center whitespace-nowrap px-2 py-1 text-[11px] leading-none`}>
                              {STATUS_MAP[order.orderStatus]?.label || order.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-semibold text-primary">{formatPrice(order.finalAmount)}</td>
                          <td className="py-3 px-2">
                            <div className="flex flex-nowrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewOrderDetail(order.orderId)}
                                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Chi tiết</span>
                              </button>

                              {order.orderStatus === 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReview(order.orderId)}
                                  className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 whitespace-nowrap"
                                  title="Đánh giá đơn hàng"
                                >
                                  <Star className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Đánh giá</span>
                                </button>
                              )}
                            </div>
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

      {isReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <form onSubmit={handleSubmitReview} className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary-900">
                Đánh giá đơn #{reviewOrderId ?? '--'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsReviewOpen(false)
                  setReviewOrderId(null)
                  setReviewRating(5)
                  setReviewComment('')
                  setReviewItemsState([])
                  setIsLoadingReviewItems(false)
                }}
                className="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {isLoadingReviewItems ? (
                <p className="text-sm text-secondary-500">Đang tải danh sách món để đánh giá...</p>
              ) : reviewItemsState.length === 0 ? (
                <p className="text-sm text-secondary-500">Không có mục nào để đánh giá.</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-secondary-700">Đánh giá từng món trong đơn</p>
                  {reviewItemsState.map((it, idx) => (
                    <div key={`${String(it.orderDetailId)}-${idx}`} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-secondary-900">{it.menuName}</div>
                        <div className="text-sm text-secondary-600">ID: {String(it.orderDetailId ?? '--')}</div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setItemRating(idx, star)}
                              className="rounded-full p-1 transition-transform hover:scale-110"
                            >
                              <Star className={`h-7 w-7 ${star <= it.rating ? 'fill-amber-400 text-amber-400' : 'text-secondary-300'}`} />
                            </button>
                          ))}
                        </div>

                        <label className="mb-2 block text-sm font-medium text-secondary-700 mt-3">Nhận xét cho món</label>
                        <textarea
                          value={it.comment}
                          onChange={(e) => setItemComment(idx, e.target.value)}
                          rows={3}
                          className="input-field w-full rounded-xl border border-border px-4 py-2 text-sm outline-none focus:border-primary"
                          placeholder="Nhận xét về món này"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewOpen(false)
                    setReviewOrderId(null)
                    setReviewRating(5)
                    setReviewComment('')
                    setReviewItemsState([])
                    setIsLoadingReviewItems(false)
                  }}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Gửi đánh giá
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
