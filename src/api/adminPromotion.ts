import apiClient from '@/lib/api'
import type {
  AdminFlashSaleRequest,
  AdminFlashSaleResponse,
  AdminVoucherRequest,
  AdminVoucherResponse,
} from '@/types'

function unwrapData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data
  }

  return payload as T
}

export const getAdminVouchersApi = async (): Promise<AdminVoucherResponse[]> => {
  const response = await apiClient.get<AdminVoucherResponse[] | { data: AdminVoucherResponse[] }>(
    '/admin/promotions/voucher'
  )

  return unwrapData(response.data) ?? []
}

export const createAdminVoucherApi = async (
  data: AdminVoucherRequest
): Promise<AdminVoucherResponse> => {
  const response = await apiClient.post<AdminVoucherResponse | { data: AdminVoucherResponse }>(
    '/admin/promotions/voucher',
    data
  )

  return unwrapData(response.data)
}

export const updateAdminVoucherApi = async (
  id: number | string,
  data: AdminVoucherRequest
): Promise<AdminVoucherResponse> => {
  const response = await apiClient.put<AdminVoucherResponse | { data: AdminVoucherResponse }>(
    `/admin/promotions/voucher/${id}`,
    data
  )

  return unwrapData(response.data)
}

export const deleteAdminVoucherApi = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/admin/promotions/voucher/${id}`)
}

export const getAdminFlashSalesApi = async (): Promise<AdminFlashSaleResponse[]> => {
  const response = await apiClient.get<AdminFlashSaleResponse[] | { data: AdminFlashSaleResponse[] }>(
    '/admin/promotions/flash-sale'
  )

  return unwrapData(response.data) ?? []
}

export const createAdminFlashSaleApi = async (
  data: AdminFlashSaleRequest
): Promise<AdminFlashSaleResponse> => {
  const response = await apiClient.post<AdminFlashSaleResponse | { data: AdminFlashSaleResponse }>(
    '/admin/promotions/flash-sale',
    data
  )

  return unwrapData(response.data)
}

export const updateAdminFlashSaleApi = async (
  id: number | string,
  data: AdminFlashSaleRequest
): Promise<AdminFlashSaleResponse> => {
  const response = await apiClient.put<AdminFlashSaleResponse | { data: AdminFlashSaleResponse }>(
    `/admin/promotions/flash-sale/${id}`,
    data
  )

  return unwrapData(response.data)
}

export const deleteAdminFlashSaleApi = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/admin/promotions/flash-sale/${id}`)
}
