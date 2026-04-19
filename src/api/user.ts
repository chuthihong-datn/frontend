import apiClient from '@/lib/api'
import type {
  AvailableVoucherResponse,
  OrderByUserResponse,
  ProfileResponse,
  ProfileUpdateRequest,
  UserVoucherResponse,
} from '@/types'

interface ApiErrorResponse {
  success?: boolean
  message?: string
}

type AvailableVoucherListPayload =
  | AvailableVoucherResponse[]
  | { data: AvailableVoucherResponse[] }
  | ApiErrorResponse

type SaveVoucherPayload =
  | AvailableVoucherResponse
  | { data: AvailableVoucherResponse }
  | ApiErrorResponse

const SAVED_VOUCHER_CACHE_KEY = 'foody-saved-vouchers'

function readSavedVoucherCache(): AvailableVoucherResponse[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(SAVED_VOUCHER_CACHE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as AvailableVoucherResponse[]
  } catch {
    return []
  }
}

function writeSavedVoucherCache(vouchers: AvailableVoucherResponse[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SAVED_VOUCHER_CACHE_KEY, JSON.stringify(vouchers))
}

export function getCachedSavedVouchers(): AvailableVoucherResponse[] {
  return readSavedVoucherCache()
}

export function cacheSavedVoucher(voucher: AvailableVoucherResponse) {
  const current = readSavedVoucherCache()
  const next = [voucher, ...current.filter((item) => String(item.voucherId) !== String(voucher.voucherId))]
  writeSavedVoucherCache(next)
}


export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get('/user/profile')
  return response.data
}

export const updateProfile = async (
  request: ProfileUpdateRequest,
  file?: File
): Promise<ProfileResponse> => {
  const formData = new FormData()

  // Add request fields as JSON if they exist
  const requestPart = new Blob(
    [JSON.stringify({
      fullName: request.fullName,
      phone: request.phone,
    })],
    { type: 'application/json' }
  )
  formData.append('request', requestPart)

  // Add file if provided
  if (file) {
    formData.append('file', file)
  }

  const response = await apiClient.put('/user/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const getMyOrders = async (): Promise<OrderByUserResponse[]> => {
  const response = await apiClient.get<OrderByUserResponse[]>('/user/order')
  return response.data
}

export const getMyOrderDetail = async (orderId: number | string): Promise<OrderByUserResponse> => {
  const response = await apiClient.get<OrderByUserResponse>(`/user/order/${orderId}`)
  return response.data
}

export const getMyVouchersApi = async (): Promise<UserVoucherResponse[]> => {
  const response = await apiClient.get<UserVoucherResponse[] | { data: UserVoucherResponse[] }>('/user/vouchers')

  if (Array.isArray(response.data)) {
    return response.data
  }

  return response.data?.data ?? []
}

export const getAvailableVouchersApi = async (): Promise<AvailableVoucherResponse[]> => {
  const response = await apiClient.get<AvailableVoucherListPayload>('/voucher')

  if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success === false) {
    throw new Error(response.data.message || 'Khong the tai danh sach voucher')
  }

  if (Array.isArray(response.data)) {
    return response.data
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data ?? []
  }

  return []
}

export const saveVoucherApi = async (
  voucherId: number | string,
  accessToken: string
): Promise<AvailableVoucherResponse> => {
  const response = await apiClient.post<SaveVoucherPayload>(`/voucher/${voucherId}/save`, null, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success === false) {
    throw new Error(response.data.message || 'Khong the luu voucher')
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data
  }

  return response.data as AvailableVoucherResponse
}
