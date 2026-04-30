'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export default function PaymentSuccessToast() {
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) {
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const queryOrderId = searchParams.get('orderId')
    const queryIsSuccess = searchParams.get('payment-success') === 'true'

    const cookieValue = document.cookie
      .split('; ')
      .find((item) => item.startsWith('payment_success_order_id='))
      ?.split('=')[1]

    const cookieOrderId = cookieValue ? decodeURIComponent(cookieValue) : null
    const orderId = queryOrderId || cookieOrderId

    if ((queryIsSuccess && queryOrderId) || cookieOrderId) {
      handledRef.current = true

      toast.success(`Đặt hàng thành công!`, {
        duration: 3000,
        description: 'Cảm ơn bạn đã mua hàng. Chúng tôi sẽ sớm xác nhận và giao hàng cho bạn.',
      })

      if (queryIsSuccess) {
        window.history.replaceState({}, '', window.location.pathname)
      }

      document.cookie = 'payment_success_order_id=; Max-Age=0; Path=/; SameSite=Lax'
    }
  }, [])

  return null
}