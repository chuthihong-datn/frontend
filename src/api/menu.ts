import apiClient from './index'
import type { Product } from '@/types'

export const getMenusApi = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>('/menus')

  if (Array.isArray(response.data)) {
    return response.data
  }

  return response.data?.data ?? []
}

export const getMenusByCategoryApi = async (categoryId: number): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>(
    `/menus/category/${categoryId}`
  )

  if (Array.isArray(response.data)) {
    return response.data
  }

  return response.data?.data ?? []
}

export const getHotMenusApi = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>('/menus/hot')

  if (Array.isArray(response.data)) {
    return response.data
  }

  return response.data?.data ?? []
}
