import apiClient from '@/lib/api'
import type { Product, ProductDetail } from '@/types'

const toNumberOrUndefined = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const normalizeMenu = (item: any): Product => ({
  id: Number(item.id),
  name: String(item.name ?? ''),
  images: Array.isArray(item.images) ? item.images : [],
  rating: Number(item.rating ?? 0),
  minPrice: Number(item.minPrice ?? 0),
  discountedPrice: toNumberOrUndefined(item.discountedPrice),
  discountPercent: toNumberOrUndefined(item.discountPercent),
  flashSale: item.flashSale === true || item.isFlashSale === true,
  flashSaleEndTime: item.flashSaleEndTime ?? undefined,
  totalSold: toNumberOrUndefined(item.totalSold),
  outOfStock: item.outOfStock === true,
})

const normalizeMenuDetail = (item: any): ProductDetail => ({
  id: Number(item.id),
  name: String(item.name ?? ''),
  description: String(item.description ?? ''),
  images: Array.isArray(item.images) ? item.images : [],
  minPrice: Number(item.minPrice ?? 0),
  discountedPrice: toNumberOrUndefined(item.discountedPrice),
  discountPercent: toNumberOrUndefined(item.discountPercent),
  flashSale: item.flashSale === true || item.isFlashSale === true,
  flashSaleEndTime: item.flashSaleEndTime ?? undefined,
  saleQuantity: toNumberOrUndefined(item.saleQuantity) ?? 1,
  amount: Number(item.amount ?? 0),
  sizes: Array.isArray(item.sizes) ? item.sizes : [],
  toppings: Array.isArray(item.toppings) ? item.toppings : [],
  rating: Number(item.rating ?? 0),
  reviewCount: Number(item.reviewCount ?? 0),
  reviews: Array.isArray(item.reviews) ? item.reviews : [],
  outOfStock: item.outOfStock === true,
})

export const getMenusApi = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>('/menus')

  if (Array.isArray(response.data)) {
    return response.data.map(normalizeMenu)
  }

  return (response.data?.data ?? []).map(normalizeMenu)
}

export const getMenusByCategoryApi = async (categoryId: number): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>(
    `/menus/category/${categoryId}`
  )

  if (Array.isArray(response.data)) {
    return response.data.map(normalizeMenu)
  }

  return (response.data?.data ?? []).map(normalizeMenu)
}

export const getHotMenusApi = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>('/menus/hot')

  if (Array.isArray(response.data)) {
    return response.data.map(normalizeMenu)
  }

  return (response.data?.data ?? []).map(normalizeMenu)
}

export const searchMenusApi = async (keyword: string): Promise<Product[]> => {
  const response = await apiClient.get<Product[] | { data: Product[] }>('/menus/search', {
    params: { keyword }
  })

  if (Array.isArray(response.data)) {
    return response.data.map(normalizeMenu)
  }

  return (response.data?.data ?? []).map(normalizeMenu)
}

export const getProductDetailApi = async (productId: number): Promise<ProductDetail> => {
  const response = await apiClient.get<ProductDetail | { data: ProductDetail }>(
    `/menus/${productId}`
  )

  // API trả về ProductDetail trực tiếp (không wrapped in data)
  if (response.data && 'images' in response.data && 'sizes' in response.data) {
    return normalizeMenuDetail(response.data)
  }

  // Nếu wrapped trong data object
  if (response.data && 'data' in response.data) {
    return normalizeMenuDetail((response.data as { data: ProductDetail }).data)
  }

  return normalizeMenuDetail(response.data)
}
