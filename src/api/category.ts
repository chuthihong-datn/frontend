import apiClient from './index'
import type { Category } from '@/types'

export const getCategoriesApi = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[] | { data: Category[] }>('/categories')

  if (Array.isArray(response.data)) {
    return response.data
  }

  return response.data?.data ?? []
}
