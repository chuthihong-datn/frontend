import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService, categoryService } from '@/lib/services/productService'
import { orderService } from '@/lib/services/orderService'
import { authService } from '@/lib/services/authService'
import { useAuthStore } from '@/store/authStore'
import type { ProductFilter } from '@/types'
import { toast } from 'sonner'

// ── Products ──────────────────────────────────────────────────────────
export function useProducts(filters?: ProductFilter) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getAll(filters),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: productService.getFeatured,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

// ── Orders ──────────────────────────────────────────────────────────
export function useMyOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', 'me', page],
    queryFn: () => orderService.getMyOrders(page),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id),
    enabled: !!id,
  })
}

// Admin: all orders
export function useAllOrders(params?: { page?: number; status?: string }) {
  return useQuery({
    queryKey: ['orders', 'all', params],
    queryFn: () => orderService.getAll(params),
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      orderService.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Cập nhật trạng thái thành công')
    },
    onError: () => toast.error('Cập nhật thất bại'),
  })
}

// ── Auth ──────────────────────────────────────────────────────────
export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setUser(data.user, data.accessToken)
      toast.success('Đăng nhập thành công!')
    },
    onError: () => toast.error('Email hoặc mật khẩu không đúng'),
  })
}

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setUser(data.user, data.accessToken)
      toast.success('Tạo tài khoản thành công!')
    },
    onError: () => toast.error('Đăng ký thất bại. Vui lòng thử lại'),
  })
}
