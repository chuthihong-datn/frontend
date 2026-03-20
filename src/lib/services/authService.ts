import apiClient from '@/lib/api'
import type { User, ApiResponse } from '@/types'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string
}

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload)
    return data.data
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload)
    return data.data
  },

  logout: async () => {
    await apiClient.post('/auth/logout')
  },

  getMe: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me')
    return data.data
  },

  updateProfile: async (payload: Partial<User>) => {
    const { data } = await apiClient.patch<ApiResponse<User>>('/auth/profile', payload)
    return data.data
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    await apiClient.post('/auth/change-password', { oldPassword, newPassword })
  },
}
