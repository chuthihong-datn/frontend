import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Extract VNPay callback parameters
    const orderId = searchParams.get('vnp_TxnRef')
    const responseCode = searchParams.get('vnp_ResponseCode')

    if (!orderId) {
      return NextResponse.redirect(new URL('/payment/error', request.url))
    }

    // Build query string for backend
    const queryString = new URLSearchParams(
      searchParams as any
    ).toString()

    // Forward the callback to the backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/payment/vnpay-return?${queryString}`
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Backend processes the payment
      if (!response.ok) {
        console.error('Backend payment processing failed:', response.status)
        return NextResponse.redirect(
          new URL(`/payment/failed?orderId=${orderId}&code=${responseCode || '99'}`, request.url)
        )
      }
    } catch (backendError) {
      console.error('Error calling backend payment endpoint:', backendError)
      // Still redirect based on response code even if backend call fails
      // because VNPay has already processed the payment
    }

    // Redirect to appropriate page based on VNPay response code
    if (responseCode === '00') {
      return NextResponse.redirect(
        new URL(`/payment/success?orderId=${orderId}`, request.url)
      )
    } else {
      return NextResponse.redirect(
        new URL(`/payment/failed?orderId=${orderId}&code=${responseCode || '99'}`, request.url)
      )
    }
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(new URL('/payment/error', request.url))
  }
}
