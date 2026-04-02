import apiClient from '@/lib/api'
import type { WardResponse } from '@/types'

interface ApiErrorResponse {
  success?: boolean
  message?: string
}

type WardApiPayload = WardResponse[] | { data: WardResponse[] } | ApiErrorResponse

export const getAllWardDeliveryApi = async (): Promise<WardResponse[]> => {
  const response = await apiClient.get<WardApiPayload>('/wards/delivery')

  if (
    response.data &&
    typeof response.data === 'object' &&
    'success' in response.data &&
    response.data.success === false
  ) {
    throw new Error(response.data.message || 'Khong the tai danh sach phuong xa')
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data || []
  }

  return []
}
