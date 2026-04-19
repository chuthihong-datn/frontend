'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User, ClipboardList, Tag, LogOut } from 'lucide-react'
import { getCachedSavedVouchers, getMyVouchersApi } from '@/api/user'
import { useAuthStore } from '@/store/authStore'
import Pagination from '@/components/shared/Pagination'
import type { UserVoucherResponse } from '@/types'
import { formatPrice } from '@/lib/utils'

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'Thông tin cá nhân', icon: User, href: '/profile' },
  { id: 'orders', label: 'Lịch sử đặt hàng', icon: ClipboardList, href: '/profile/orders' },
  { id: 'vouchers', label: 'Voucher của tôi', icon: Tag, href: '/profile/my-voucher' },
]

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  available: { label: 'Khả dụng', class: 'status-delivered' },
  incoming: { label: 'Sắp áp dụng', class: 'status-shipping' },
  expired: { label: 'Hết hạn', class: 'status-cancelled' },
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getVoucherStatus(voucher: UserVoucherResponse): 'available' | 'incoming' | 'expired' {
  const now = Date.now()
  const startTime = new Date(voucher.startDate).getTime()
  const endTime = new Date(voucher.endDate).getTime()

  if (Number.isFinite(endTime) && endTime < now) {
    return 'expired'
  }

  if (Number.isFinite(startTime) && startTime > now) {
    return 'incoming'
  }

  return 'available'
}

function getVoucherBenefitText(voucher: UserVoucherResponse): string {
  const discountType = String(voucher.discountType || '').trim().toUpperCase()
  const discountValue = Number(voucher.discountValue || 0)
  const maxDiscount = Number(voucher.maxDiscount || 0)
  const minOrderAmount = Number(voucher.minOrderAmount || 0)

  const chunks: string[] = []

  if (discountType.includes('PERCENT')) {
    chunks.push(`Giảm ${discountValue}%`)
  } else {
    chunks.push(`Giảm ${formatPrice(discountValue)}`)
  }

  if (minOrderAmount > 0) {
    chunks.push(`đơn từ ${formatPrice(minOrderAmount)}`)
  }

  if (maxDiscount > 0) {
    chunks.push(`tối đa ${formatPrice(maxDiscount)}`)
  }

  return chunks.join(' • ')
}

export default function VoucherPage() {
  const { logout, accessToken } = useAuthStore()
  const router = useRouter()
  const [vouchers, setVouchers] = useState<UserVoucherResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchMyVouchers = async () => {
      if (!accessToken) {
        setVouchers([])
        return
      }

      setIsLoading(true)
      try {
        const data = await getMyVouchersApi()
        const cached = getCachedSavedVouchers()
        const merged = [...(data || []), ...cached].filter(
          (voucher, index, self) =>
            index === self.findIndex((item) => String(item.voucherId) === String(voucher.voucherId))
        )
        setVouchers(merged)
      } catch (error: any) {
        const cached = getCachedSavedVouchers()
        if (cached.length > 0) {
          setVouchers(cached)
        }

        toast.error(error?.response?.data?.message || error?.message || 'Không thể tải voucher của bạn')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyVouchers()
  }, [accessToken])

  const sortedVouchers = useMemo(() => {
    return [...vouchers].sort((a, b) => {
      const aEnd = new Date(a.endDate).getTime()
      const bEnd = new Date(b.endDate).getTime()

      if (!Number.isFinite(aEnd) || !Number.isFinite(bEnd)) {
        return 0
      }

      return bEnd - aEnd
    })
  }, [vouchers])

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
                      item.id === 'vouchers'
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
            <h2 className="font-semibold text-secondary-900 mb-5">Voucher của tôi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Mã voucher', 'Mô tả', 'Hạn sử dụng', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="text-left py-3 px-2 text-secondary-500 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-secondary-500">
                        Đang tải voucher của bạn...
                      </td>
                    </tr>
                  ) : sortedVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-secondary-500">
                        Bạn chưa có voucher nào
                      </td>
                    </tr>
                  ) : (
                    sortedVouchers.map((voucher) => {
                      const status = getVoucherStatus(voucher)

                      return (
                        <tr
                          key={String(voucher.voucherId)}
                          className="border-b border-border last:border-0 hover:bg-secondary-50 transition-colors"
                        >
                          <td className="py-3 px-2 font-mono font-semibold text-secondary-900">{voucher.code}</td>
                          <td className="py-3 px-2 text-secondary-600 min-w-[280px]">
                            <div className="font-medium text-secondary-800">{voucher.title}</div>
                            <div>{voucher.description}</div>
                            <div className="text-xs text-secondary-500 mt-1">{getVoucherBenefitText(voucher)}</div>
                          </td>
                          <td className="py-3 px-2 text-secondary-600">
                            {formatDate(voucher.endDate)}
                          </td>
                          <td className="py-3 px-2">
                            <span className={STATUS_MAP[status]?.class ?? 'badge'}>
                              {STATUS_MAP[status]?.label}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <button className="text-primary hover:underline text-xs font-medium">Chi tiết</button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <Pagination page={1} totalPages={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}