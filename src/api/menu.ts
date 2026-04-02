import apiClient from '@/lib/api'
import type { Product, ProductDetail } from '@/types'

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

export const searchMenusApi = async (keyword: string): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>('/menus/search', {
    params: { keyword }
  })

  if (Array.isArray(response.data)) {
    return response.data
  }

  return response.data?.data ?? []
}

export const getProductDetailApi = async (productId: number): Promise<ProductDetail> => {
  const response = await apiClient.get<ProductDetail | { data: ProductDetail }>(
    `/menus/${productId}`
  )

  // API trả về ProductDetail trực tiếp (không wrapped in data)
  if (response.data && 'images' in response.data && 'sizes' in response.data) {
    return response.data as ProductDetail
  }

  // Nếu wrapped trong data object
  if (response.data && 'data' in response.data) {
    return (response.data as { data: ProductDetail }).data
  }

  return response.data as ProductDetail
}
