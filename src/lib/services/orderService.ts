import apiClient from '@/lib/api'
import type { Order, ApiResponse, PaginatedResponse, DeliveryAddress, PaymentMethod } from '@/types'

interface CreateOrderPayload {
  items: Array<{
    productId: string
    quantity: number
    sizeId?: string
    toppingIds: string[]
  }>
  deliveryAddress: DeliveryAddress
  paymentMethod: PaymentMethod
  voucherCode?: string
}

export const orderService = {
  create: async (payload: CreateOrderPayload) => {
    const { data } = await apiClient.post<ApiResponse<Order>>('/orders', payload)
    return data.data
  },

  getMyOrders: async (page = 1, limit = 10) => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders/me', {
      params: { page, limit },
    })
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`)
    return data.data
  },

  // Admin only
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', { params })
    return data
  },

  updateStatus: async (id: string, status: string, note?: string) => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, {
      status,
      note,
    })
    return data.data
  },

  cancel: async (id: string, reason: string) => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/cancel`, {
      reason,
    })
    return data.data
  },
}
