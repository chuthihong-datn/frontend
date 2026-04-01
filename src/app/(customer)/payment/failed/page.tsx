'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { toast } from 'sonner'

const ERROR_MESSAGES: Record<string, string> = {
  '07': 'Giao dịch bị từ chối',
  '09': 'Thẻ không hợp lệ',
  '10': 'Chủ thẻ từ chối',
  '11': 'Thẻ hết hạn',
  '12': 'Lỗi định dạng',
  '13': 'Số tiền không hợp lệ',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản không đủ tiền',
  '65': 'Vượt quá giới hạn giao dịch',
  '75': 'Ngân hàng từ chối',
  '99': 'Lỗi không xác định',
}

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const errorCode = searchParams.get('code') || '99'
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      const errorMsg = ERROR_MESSAGES[errorCode] || 'Thanh toán thất bại'
      toast.error(errorMsg, { duration: 5000 })
      setIsLoading(false)
    } else {
      router.push('/cart')
    }
  }, [orderId, errorCode, router])

  if (isLoading) {
    return (
      <div className="container-page py-16 text-center text-secondary-600">
        Đang xử lý...
      </div>
    )
  }

  return (
    <div className="container-page py-16 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <XCircle className="w-20 h-20 text-error" />
        </div>

        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Thanh toán thất bại
        </h1>

        <p className="text-secondary-600 mb-2">
          Đơn hàng #{orderId}
        </p>

        <p className="text-secondary-500 text-sm mb-2">
          {ERROR_MESSAGES[errorCode] || 'Có lỗi xảy ra khi thanh toán'}
        </p>

        <p className="text-secondary-500 text-sm mb-8">
          Vui lòng thử lại hoặc chọn phương thức thanh toán khác
        </p>

        <div className="space-y-3">
          <Link href="/cart" className="btn-primary btn-lg w-full block">
            Quay lại giỏ hàng
          </Link>
          <Link href="/" className="btn-outline btn-lg w-full block">
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
