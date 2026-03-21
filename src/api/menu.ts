import apiClient from './index'
import type { Product } from '@/types'

export const getMenusApi = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>('/menus')

  if (Array.isArray(response.data)) {
    return response.data
  }

  return response.data?.data ?? []
}
