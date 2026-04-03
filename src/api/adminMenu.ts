import apiClient from '@/lib/api'
import type { AdminMenuRequest, AdminMenuResponse } from '@/types'

function unwrapData<T>(payload: T | { data: T }): T {
	if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
		return (payload as { data: T }).data
	}

	return payload as T
}

function toFormData(data: AdminMenuRequest, files: File[] = []): FormData {
	const formData = new FormData()
	formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))

	files.forEach((file) => {
		formData.append('files', file)
	})

	return formData
}

export const getAdminMenusApi = async (): Promise<AdminMenuResponse[]> => {
	const response = await apiClient.get<AdminMenuResponse[] | { data: AdminMenuResponse[] }>(
		'/admin/menus'
	)

	return unwrapData(response.data) ?? []
}

export const getAdminMenuDetailApi = async (id: number | string): Promise<AdminMenuResponse> => {
	const response = await apiClient.get<AdminMenuResponse | { data: AdminMenuResponse }>(
		`/admin/menus/${id}`
	)

	return unwrapData(response.data)
}

export const createAdminMenuApi = async (
	data: AdminMenuRequest,
	files: File[] = []
): Promise<AdminMenuResponse> => {
	const response = await apiClient.post<AdminMenuResponse | { data: AdminMenuResponse }>(
		'/admin/menus',
		toFormData(data, files),
		{
			headers: { 'Content-Type': 'multipart/form-data' },
		}
	)

	return unwrapData(response.data)
}

export const updateAdminMenuApi = async (
	id: number | string,
	data: AdminMenuRequest,
	files: File[] = []
): Promise<AdminMenuResponse> => {
	const response = await apiClient.put<AdminMenuResponse | { data: AdminMenuResponse }>(
		`/admin/menus/${id}`,
		toFormData(data, files),
		{
			headers: { 'Content-Type': 'multipart/form-data' },
		}
	)

	return unwrapData(response.data)
}

export const deleteAdminMenuApi = async (id: number | string): Promise<void> => {
	await apiClient.delete(`/admin/menus/${id}`)
}