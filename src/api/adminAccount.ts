import apiClient from '@/lib/api'
import type { AdminAccountRequest, AdminAccountResponse } from '@/types'

function unwrapData<T>(payload: T | { data: T }): T {
	if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
		return (payload as { data: T }).data
	}

	return payload as T
}

export const getAdminAccountsApi = async (): Promise<AdminAccountResponse[]> => {
	const response = await apiClient.get<AdminAccountResponse[] | { data: AdminAccountResponse[] }>(
		'/admin/accounts'
	)

	return unwrapData(response.data) ?? []
}

function toFormData(data: AdminAccountRequest, avatar?: File | null): FormData {
	const formData = new FormData()
	formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))

	if (avatar) {
		formData.append('avatar', avatar)
	}

	return formData
}

export const updateAdminAccountApi = async (
	id: number | string,
	data: AdminAccountRequest,
	avatar?: File | null
): Promise<AdminAccountResponse> => {
	const response = await apiClient.put<AdminAccountResponse | { data: AdminAccountResponse }>(
		`/admin/accounts/${id}`,
		toFormData(data, avatar),
		{
			headers: { 'Content-Type': 'multipart/form-data' },
		}
	)

	return unwrapData(response.data)
}

export const disableAdminAccountApi = async (id: number | string): Promise<void> => {
	await apiClient.delete(`/admin/accounts/${id}`)
}
