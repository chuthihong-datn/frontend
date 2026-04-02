import apiClient from '@/lib/api'

export interface ProfileUpdateRequest {
  fullName?: string
  phone?: string
}

export interface ProfileResponse {
  accountId: number
  fullName: string
  email: string
  phone: string
  avtUrl: string
  createdAt: string
}

/**
 * Fetch user profile
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get('/user/profile')
  return response.data
}

/**
 * Update user profile with optional avatar file
 */
export const updateProfile = async (
  request: ProfileUpdateRequest,
  file?: File
): Promise<ProfileResponse> => {
  const formData = new FormData()

  // Add request fields as JSON if they exist
  const requestPart = new Blob(
    [JSON.stringify({
      fullName: request.fullName,
      phone: request.phone,
    })],
    { type: 'application/json' }
  )
  formData.append('request', requestPart)

  // Add file if provided
  if (file) {
    formData.append('file', file)
  }

  const response = await apiClient.put('/user/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}
