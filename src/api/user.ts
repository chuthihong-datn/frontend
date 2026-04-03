import apiClient from '@/lib/api'
import type { ProfileResponse, ProfileUpdateRequest } from '@/types'


export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get('/user/profile')
  return response.data
}

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
