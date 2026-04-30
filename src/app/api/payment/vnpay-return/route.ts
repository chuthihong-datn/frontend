import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Extract VNPay callback parameters
    const orderId = searchParams.get('vnp_TxnRef')
    const responseCode = searchParams.get('vnp_ResponseCode')
    const amount = searchParams.get('vnp_Amount')

    console.log('[VNPay Callback] Received params:', {
      orderId,
      responseCode,
      amount,
    })

    if (!orderId) {
      console.error('[VNPay Callback] Missing orderId')
      return NextResponse.redirect(new URL('/payment/error', request.url))
    }

    // Build query string for backend
    const queryString = new URLSearchParams(
      searchParams as any
    ).toString()

    // Forward the callback to the backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/payment/vnpay-return?${queryString}`
    console.log('[VNPay Callback] Forwarding to backend:', backendUrl)
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'follow', // Allow following redirects from backend
      })

      console.log('[VNPay Callback] Backend response status:', response.status)

      // Backend processes the payment
      // We still check if response is ok, but if backend fails,
      // we redirect based on VNPay responseCode instead of failing immediately
      if (!response.ok) {
        console.warn('Backend payment processing returned non-ok status:', response.status)
        // Try to read error message from backend
        try {
          const errorText = await response.text()
          console.error('[VNPay Callback] Backend error response:', errorText)
        } catch (e) {
          // Ignore error reading response
        }
      }
    } catch (backendError) {
      console.error('[VNPay Callback] Error calling backend:', backendError)
      // Still redirect based on response code even if backend call fails
      // because VNPay has already confirmed the payment
    }

    // Redirect to appropriate page based on VNPay response code
    // VNPay responseCode='00' means payment successful at VNPay's end
    // Backend processes order update separately
    if (responseCode === '00') {
      console.log('[VNPay Callback] Payment successful, redirecting to order history page')
      const response = NextResponse.redirect(
        new URL('/profile/orders', request.url)
      )

      response.cookies.set('payment_success_order_id', orderId, {
        path: '/',
        maxAge: 120,
        sameSite: 'lax',
      })

      return response
    } else {
      console.log('[VNPay Callback] Payment failed with code:', responseCode)
      return NextResponse.redirect(
        new URL(`/payment/failed?orderId=${orderId}&code=${responseCode || '99'}`, request.url)
      )
    }
  } catch (error) {
    console.error('[VNPay Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/payment/error', request.url))
  }
}
