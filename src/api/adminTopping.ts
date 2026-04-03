import apiClient from '@/lib/api'
import type { AdminToppingRequest, AdminToppingResponse } from '@/types'

function unwrapData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export const getAdminToppingsApi = async (): Promise<AdminToppingResponse[]> => {
  const response = await apiClient.get<AdminToppingResponse[] | { data: AdminToppingResponse[] }>(
    '/admin/toppings'
  )
  return unwrapData(response.data) ?? []
}

export const searchAdminToppingsApi = async (keyword?: string): Promise<AdminToppingResponse[]> => {
  const response = await apiClient.get<AdminToppingResponse[] | { data: AdminToppingResponse[] }>(
    '/admin/toppings/search',
    {
      params: { keyword },
    }
  )
  return unwrapData(response.data) ?? []
}

export const createAdminToppingApi = async (
  data: AdminToppingRequest
): Promise<AdminToppingResponse> => {
  const response = await apiClient.post<AdminToppingResponse | { data: AdminToppingResponse }>(
    '/admin/toppings',
    data
  )
  return unwrapData(response.data)
}

export const updateAdminToppingApi = async (
  id: number | string,
  data: AdminToppingRequest
): Promise<AdminToppingResponse> => {
  const response = await apiClient.put<AdminToppingResponse | { data: AdminToppingResponse }>(
    `/admin/toppings/${id}`,
    data
  )
  return unwrapData(response.data)
}

export const deleteAdminToppingApi = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/admin/toppings/${id}`)
}
