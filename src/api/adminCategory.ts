import apiClient from '@/lib/api'
import type { AdminCategoryRequest, AdminCategoryResponse } from '@/types'

function unwrapData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function toFormData(data: AdminCategoryRequest, file?: File | null): FormData {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))

  if (file) {
    formData.append('file', file)
  }

  return formData
}

export const getAdminCategoriesApi = async (): Promise<AdminCategoryResponse[]> => {
  const response = await apiClient.get<AdminCategoryResponse[] | { data: AdminCategoryResponse[] }>(
    '/admin/categories'
  )
  return unwrapData(response.data) ?? []
}

export const searchAdminCategoriesApi = async (
  keyword?: string
): Promise<AdminCategoryResponse[]> => {
  const response = await apiClient.get<AdminCategoryResponse[] | { data: AdminCategoryResponse[] }>(
    '/admin/categories/search',
    {
      params: { keyword },
    }
  )

  return unwrapData(response.data) ?? []
}

export const createAdminCategoryApi = async (
  data: AdminCategoryRequest,
  file?: File | null
): Promise<AdminCategoryResponse> => {
  const response = await apiClient.post<AdminCategoryResponse | { data: AdminCategoryResponse }>(
    '/admin/categories',
    toFormData(data, file),
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )

  return unwrapData(response.data)
}

export const updateAdminCategoryApi = async (
  id: number | string,
  data: AdminCategoryRequest,
  file?: File | null
): Promise<AdminCategoryResponse> => {
  const response = await apiClient.put<AdminCategoryResponse | { data: AdminCategoryResponse }>(
    `/admin/categories/${id}`,
    toFormData(data, file),
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )

  return unwrapData(response.data)
}

export const deleteAdminCategoryApi = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/admin/categories/${id}`)
}
