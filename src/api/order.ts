import apiClient from './index'

type BackendPaymentMethod = 'VNPAY' | 'MOMO' | 'CASH'

export interface CreateOrderRequest {
  paymentMethod: BackendPaymentMethod
  fullName: string
  phone: string
  wardId: number
  addressDetail: string
  note?: string
  voucherCode?: string
}

interface ApiErrorResponse {
  success?: boolean
  message?: string
}

export interface CreateOrderResponse {
  orderId: number
  paymentUrl?: string
  message?: string
}

type CreateOrderApiPayload = CreateOrderResponse | { data: CreateOrderResponse } | ApiErrorResponse

export const createOrderApi = async (
  payload: CreateOrderRequest,
  accessToken: string
): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderApiPayload>('/orders', payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (
    response.data &&
    typeof response.data === 'object' &&
    'success' in response.data &&
    response.data.success === false
  ) {
    throw new Error(response.data.message || 'Khong the tao don hang')
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data
  }

  return response.data as CreateOrderResponse
}