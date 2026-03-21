import apiClient from "./index"
import { LoginRequest, LoginResponse } from "@/types/index"
import { RegisterRequest, RegisterResponse } from "@/types/index"

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", data)
  return response.data
}

export const registerApi = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>("/auth/register", data)
  return response.data
}
