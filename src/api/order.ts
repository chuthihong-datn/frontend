import apiClient from '@/lib/api'
import type {
  AdminOrderResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  UpdateAdminOrderStatusRequest,
} from '@/types'

interface ApiErrorResponse {
  success?: boolean
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

export const getAdminOrdersApi = async (): Promise<AdminOrderResponse[]> => {
  const response = await apiClient.get<AdminOrderResponse[]>('/admin/orders')
  return response.data
}

export const getAdminOrderDetailApi = async (
  id: number | string
): Promise<AdminOrderResponse> => {
  const response = await apiClient.get<AdminOrderResponse>(`/admin/orders/${id}`)
  return response.data
}

export const updateAdminOrderStatusApi = async (
  id: number | string,
  payload: UpdateAdminOrderStatusRequest
): Promise<AdminOrderResponse> => {
  const response = await apiClient.put<AdminOrderResponse>(`/admin/orders/${id}/status`, payload)
  return response.data
}