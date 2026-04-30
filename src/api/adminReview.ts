import apiClient from '@/lib/api'
import type { AdminReviewResponse } from '@/types'

function unwrapData<T>(payload: T | { data: T }): T {
	if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
		return (payload as { data: T }).data
	}

	return payload as T
}

export const getAdminReviewsApi = async (
	menuId?: number | string | null,
	rating?: number | null
): Promise<AdminReviewResponse[]> => {
	const response = await apiClient.get<AdminReviewResponse[] | { data: AdminReviewResponse[] }>(
		'/admin/reviews',
		{
			params: {
				menuId: menuId ?? undefined,
				rating: rating ?? undefined,
			},
		}
	)

	return unwrapData(response.data) ?? []
}

export const hideAdminReviewApi = async (reviewId: number | string): Promise<void> => {
	await apiClient.put(`/admin/reviews/${reviewId}/hide`)
}
