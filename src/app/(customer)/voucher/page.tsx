'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cacheSavedVoucher, getAvailableVouchersApi, saveVoucherApi } from '@/api/user'
import { useAuthStore } from '@/store/authStore'
import type { AvailableVoucherResponse } from '@/types'
import { formatPrice } from '@/lib/utils'

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

function buildVoucherSummary(voucher: AvailableVoucherResponse): string {
  const discountType = String(voucher.discountType || '').trim().toUpperCase()
  const discountValue = Number(voucher.discountValue || 0)
  const minOrder = Number(voucher.minOrderAmount || 0)
  const maxDiscount = Number(voucher.maxDiscount || 0)

  const chunks: string[] = []

  if (discountType.includes('PERCENT')) {
    chunks.push(`Giảm ${discountValue}%`)
  } else {
    chunks.push(`Giảm ${formatPrice(discountValue)}`)
  }

  if (minOrder > 0) {
    chunks.push(`đơn từ ${formatPrice(minOrder)}`)
  }

  if (maxDiscount > 0) {
    chunks.push(`giảm tối đa ${formatPrice(maxDiscount)}`)
  }

  return chunks.join(' • ')
}

function getExpiresLabel(endDate: string): string {
  const end = new Date(endDate).getTime()
  if (!Number.isFinite(end)) {
    return 'Không xác định hạn'
  }

  const now = Date.now()
  const diffMs = Math.max(0, end - now)
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (days > 0) {
    return `Hết hạn trong ${days} ngày`
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours > 0) {
    return `Hết hạn trong ${hours} giờ`
  }

  return 'Sắp hết hạn'
}

export default function VoucherPage() {
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)
  const [vouchers, setVouchers] = useState<AvailableVoucherResponse[]>([])
  const [savedVoucherIds, setSavedVoucherIds] = useState<Array<string | number>>([])
  const [savingVoucherId, setSavingVoucherId] = useState<string | number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchVouchers = async () => {
      setIsLoading(true)

      try {
        const data = await getAvailableVouchersApi()
        setVouchers(data)
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Không thể tải kho voucher')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVouchers()
  }, [])

  const sortedVouchers = useMemo(() => {
    return [...vouchers].sort((a, b) => {
      if (a.outOfStock === b.outOfStock) {
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      }
      return a.outOfStock ? 1 : -1
    })
  }, [vouchers])

  const handleSaveVoucher = async (voucher: AvailableVoucherResponse) => {
    if (voucher.outOfStock || savedVoucherIds.includes(voucher.voucherId)) {
      return
    }

    if (!accessToken) {
      toast.error('Vui lòng đăng nhập để lưu voucher')
      router.push('/login')
      return
    }

    setSavingVoucherId(voucher.voucherId)

    try {
      const response = await saveVoucherApi(voucher.voucherId, accessToken)

      if (response.outOfStock) {
        toast.error('Voucher đã hết lượt lưu')
        setVouchers((current) =>
          current.map((item) =>
            String(item.voucherId) === String(voucher.voucherId)
              ? { ...item, outOfStock: true }
              : item
          )
        )
        return
      }

      cacheSavedVoucher(response)
      setSavedVoucherIds((current) => [...current, response.voucherId])
      toast.success(`Đã lưu mã ${response.code}`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể lưu voucher')
    } finally {
      setSavingVoucherId(null)
    }
  }

  return (
    <div className="container-page py-8">
      <nav className="text-sm text-secondary-500 mb-4">
        <span>Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="text-secondary-900 font-medium">Kho Voucher & Ưu Đãi</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-1">
          Kho Voucher Hệ Thống
        </h1>
        <span className="flex items-center gap-2 text-sm text-secondary-600 bg-secondary-100 px-3 py-1.5 rounded-full">
          🎫 Đang có <strong>{sortedVouchers.length} mã</strong>
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-10 text-secondary-500">
            Đang tải voucher...
          </div>
        ) : sortedVouchers.length === 0 ? (
          <div className="col-span-full text-center py-10 text-secondary-500">
            Hiện chưa có voucher khả dụng
          </div>
        ) : (
          sortedVouchers.map((voucher) => {
            const isSaved = savedVoucherIds.includes(voucher.voucherId)
            const isDisabled = voucher.outOfStock || isSaved || savingVoucherId === voucher.voucherId

            return (
              <div
                key={String(voucher.voucherId)}
                className={`rounded-2xl border p-5 relative overflow-hidden ${
                  voucher.outOfStock ? 'bg-secondary-100 border-secondary-300 opacity-80' : 'bg-orange-50 border-primary/20'
                }`}
              >
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-900 text-sm">{voucher.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-error" />
                      <span className="text-xs text-error font-medium">{getExpiresLabel(voucher.endDate)}</span>
                    </div>
                    <p className="text-xs text-secondary-500 mt-1">Hạn đến: {formatDate(voucher.endDate)}</p>
                  </div>
                </div>

                <p className="text-xs text-secondary-600 mb-3">{buildVoucherSummary(voucher)}</p>

                <div className="border-t border-dashed border-secondary-200 pt-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-secondary-500">CODE: </span>
                    <span className="font-mono font-bold text-secondary-800">{voucher.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveVoucher(voucher)}
                    disabled={isDisabled}
                    className={`btn-sm text-xs px-3 py-1.5 rounded-lg font-medium ${
                      isDisabled ? 'bg-secondary-300 text-secondary-600 cursor-not-allowed' : 'btn-primary'
                    }`}
                  >
                    {savingVoucherId === voucher.voucherId
                      ? 'Đang lưu...'
                      : isSaved
                        ? 'Đã lưu'
                        : voucher.outOfStock
                          ? 'Hết lượt'
                          : 'Lưu mã'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}