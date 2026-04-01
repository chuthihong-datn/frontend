import apiClient from './index'
import type { AddToCartRequestPayload, CartResponse } from '@/types'

interface ApiErrorResponse {
  success?: boolean
  message?: string
}

type CartApiPayload = CartResponse | { data: CartResponse } | ApiErrorResponse

export const addToCartApi = async (
  payload: AddToCartRequestPayload,
  accessToken: string
): Promise<string> => {
  const response = await apiClient.post<string | ApiErrorResponse>('/cart/items', payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.data && typeof response.data === 'object' && response.data.success === false) {
    throw new Error(response.data.message || 'Khong the them vao gio hang')
  }

  if (typeof response.data === 'string') {
    return response.data
  }

  return response.data?.message || 'Added to cart successfully'
}

export const getCartApi = async (accessToken: string): Promise<CartResponse> => {
  const response = await apiClient.get<CartApiPayload>('/cart', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success === false) {
    throw new Error(response.data.message || 'Khong the lay gio hang')
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data
  }

  return response.data as CartResponse
}

export const updateCartItemQuantityApi = async (
  itemId: string | number,
  quantity: number,
  accessToken: string
): Promise<CartResponse> => {
  const response = await apiClient.put<CartApiPayload>(`/cart/items/${itemId}`, { quantity }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success === false) {
    throw new Error(response.data.message || 'Khong the cap nhat gio hang')
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data
  }

  return response.data as CartResponse
}

export const deleteCartItemApi = async (
  itemId: string | number,
  accessToken: string
): Promise<CartResponse> => {
  const response = await apiClient.delete<CartApiPayload>(`/cart/items/${itemId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success === false) {
    throw new Error(response.data.message || 'Khong the xoa khoi gio hang')
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data
  }

  return response.data as CartResponse
}
