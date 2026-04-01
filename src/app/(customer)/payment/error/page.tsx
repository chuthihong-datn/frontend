'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function PaymentErrorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    toast.error('Có lỗi không xác định xảy ra', { duration: 5000 })
    setIsLoading(false)
  }, [])

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
          <AlertCircle className="w-20 h-20 text-error" />
        </div>

        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Lỗi xử lý
        </h1>

        <p className="text-secondary-600 mb-8">
          Có lỗi không xác định xảy ra khi xử lý thanh toán. Vui lòng liên hệ với chúng tôi để được hỗ trợ.
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
