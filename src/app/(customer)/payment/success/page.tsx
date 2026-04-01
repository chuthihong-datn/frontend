'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      toast.success('Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.', {
        duration: 3000,
      })
      setIsLoading(false)
    } else {
      router.push('/cart')
    }
  }, [orderId, router])

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
          <CheckCircle className="w-20 h-20 text-success" />
        </div>

        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Thanh toán thành công!
        </h1>

        <p className="text-secondary-600 mb-2">
          Đơn hàng #{orderId} đã được tạo và xác nhận
        </p>

        <p className="text-secondary-500 text-sm mb-8">
          Bạn sẽ nhận được thông báo về tình trạng giao hàng qua email và SMS
        </p>

        <div className="space-y-3">
          <Link href="/" className="btn-primary btn-lg w-full block">
            Quay về trang chủ
          </Link>
          <Link href="/menu" className="btn-outline btn-lg w-full block">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  )
}
