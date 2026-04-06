import apiClient from '@/lib/api'
import type { AdminWardRequest, AdminWardResponse, WardResponse } from '@/types'

interface ApiErrorResponse {
  success?: boolean
  message?: string
}

type WardApiPayload = WardResponse[] | { data: WardResponse[] } | ApiErrorResponse

type AdminWardApiPayload =
  | AdminWardResponse
  | AdminWardResponse[]
  | { data: AdminWardResponse }
  | { data: AdminWardResponse[] }
  | ApiErrorResponse

function assertBusinessSuccess(payload: unknown): void {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in (payload as Record<string, unknown>) &&
    (payload as { success?: boolean }).success === false
  ) {
    const message =
      (payload as { message?: string }).message || 'Khong the xu ly du lieu dia chi giao hang'
    throw new Error(message)
  }
}

function unwrapData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data
  }

  return payload as T
}

export const getAllWardDeliveryApi = async (): Promise<WardResponse[]> => {
  const response = await apiClient.get<WardApiPayload>('/wards/delivery')

  assertBusinessSuccess(response.data)

  if (Array.isArray(response.data)) {
    return response.data
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data || []
  }

  return []
}

export const getAdminWardsApi = async (): Promise<AdminWardResponse[]> => {
  const response = await apiClient.get<AdminWardApiPayload>('/admin/wards')
  assertBusinessSuccess(response.data)

  const unwrapped = unwrapData(response.data as AdminWardResponse[] | { data: AdminWardResponse[] })
  return Array.isArray(unwrapped) ? unwrapped : []
}

export const searchAdminWardsApi = async (keyword: string): Promise<AdminWardResponse[]> => {
  const response = await apiClient.get<AdminWardApiPayload>('/admin/wards/search', {
    params: { keyword },
  })
  assertBusinessSuccess(response.data)

  const unwrapped = unwrapData(response.data as AdminWardResponse[] | { data: AdminWardResponse[] })
  return Array.isArray(unwrapped) ? unwrapped : []
}

export const updateAdminWardApi = async (
  wardId: number | string,
  payload: AdminWardRequest
): Promise<AdminWardResponse> => {
  const response = await apiClient.put<AdminWardApiPayload>(`/admin/wards/${wardId}`, payload)
  assertBusinessSuccess(response.data)

  return unwrapData(response.data as AdminWardResponse | { data: AdminWardResponse })
}

export const deleteAdminWardApi = async (wardId: number | string): Promise<void> => {
  const response = await apiClient.delete<ApiErrorResponse>(`/admin/wards/${wardId}`)
  assertBusinessSuccess(response.data)
}
