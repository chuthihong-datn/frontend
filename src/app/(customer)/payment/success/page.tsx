'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ClipboardList, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const [isLoading, setIsLoading] = useState(true)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!orderId) {
      router.replace('/')
      return
    }

    toast.success('Đặt hàng thành công! Đang chuyển hướng về trang chủ', {
      duration: 3000,
    })

    setIsLoading(false)

    const countdownTimer = window.setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0))
    }, 1000)

    const redirectTimer = window.setTimeout(() => {
      router.replace('/')
    }, 3000)

    return () => {
      window.clearInterval(countdownTimer)
      window.clearTimeout(redirectTimer)
    }
  }, [orderId, router])

  if (isLoading) {
    return (
      <div className="container-page min-h-screen flex items-center justify-center py-16">
        <div className="rounded-3xl border border-border bg-white px-6 py-10 text-center shadow-lg shadow-black/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <p className="text-secondary-600">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page min-h-screen py-10 flex items-center justify-center">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-border bg-white shadow-2xl shadow-black/10">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-success via-emerald-400 to-primary" />
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-success/10 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="mb-6 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/10">
              <CheckCircle2 className="h-14 w-14 text-success" />
            </div>
          </div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm font-medium text-success">
            <Sparkles className="h-4 w-4" />
            Thanh toán thành công
          </div>

          <h1 className="text-3xl font-bold text-secondary-900 sm:text-4xl">
            Đơn hàng đã được xác nhận
          </h1>

          <p className="mt-3 text-secondary-600">
            Đơn hàng <span className="font-semibold text-secondary-900">#{orderId}</span> đã được ghi nhận.
            Bạn sẽ được chuyển đến trang chủ trong <span className="font-semibold text-primary">{countdown}</span> giây.
          </p>

          <div className="mt-8 rounded-2xl bg-secondary-50 px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-secondary-900">Tiếp theo</h2>
                <p className="mt-1 text-sm text-secondary-600">
                  Bạn có thể xem lịch sử đặt hàng hoặc tiếp tục mua sắm thêm các sản phẩm khác.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/" className="btn-primary btn-lg inline-flex w-full items-center justify-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Quay lại trang chủ
            </Link>
            <Link href="/menu" className="btn-outline btn-lg inline-flex w-full items-center justify-center gap-2">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
