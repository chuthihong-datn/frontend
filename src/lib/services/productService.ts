import apiClient from '@/lib/api'
import type { Product, Category, ApiResponse, PaginatedResponse, ProductFilter } from '@/types'

export const productService = {
  getAll: async (filters?: ProductFilter) => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: filters,
    })
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`)
    return data.data
  },

  getBySlug: async (slug: string) => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/slug/${slug}`)
    return data.data
  },

  getFeatured: async () => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products/featured')
    return data.data
  },

  // Admin only
  create: async (payload: Partial<Product>) => {
    const { data } = await apiClient.post<ApiResponse<Product>>('/products', payload)
    return data.data
  },

  update: async (id: string, payload: Partial<Product>) => {
    const { data } = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, payload)
    return data.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/products/${id}`)
  },
}

export const categoryService = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories')
    return data.data
  },
}
