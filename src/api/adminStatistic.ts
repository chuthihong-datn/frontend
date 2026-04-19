import apiClient from '@/lib/api'
import type {
  AdminDailyStatsResponse,
  AdminHourlyStatsResponse,
  AdminMonthlyStatsResponse,
  AdminTodayMenuStatisticResponse,
} from '@/types'

function unwrapData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data
  }

  return payload as T
}

export const getAdminDailyStatsApi = async (): Promise<AdminDailyStatsResponse[]> => {
  const response = await apiClient.get<AdminDailyStatsResponse[] | { data: AdminDailyStatsResponse[] }>(
    '/admin/stats/daily'
  )

  return unwrapData(response.data) ?? []
}

export const getAdminHourlyStatsApi = async (): Promise<AdminHourlyStatsResponse[]> => {
  const response = await apiClient.get<AdminHourlyStatsResponse[] | { data: AdminHourlyStatsResponse[] }>(
    '/admin/stats/hourly'
  )

  return unwrapData(response.data) ?? []
}

export const getAdminMonthlyStatsApi = async (): Promise<AdminMonthlyStatsResponse[]> => {
  const response = await apiClient.get<AdminMonthlyStatsResponse[] | { data: AdminMonthlyStatsResponse[] }>(
    '/admin/stats/monthly'
  )

  return unwrapData(response.data) ?? []
}

export const getAdminTodayMenuStatsApi = async (): Promise<AdminTodayMenuStatisticResponse[]> => {
  const response = await apiClient.get<AdminTodayMenuStatisticResponse[] | { data: AdminTodayMenuStatisticResponse[] }>(
    '/admin/stats/today-menu'
  )

  return unwrapData(response.data) ?? []
}

export const getAdminMonthlyMenuStatsApi = async (
  year: number,
  month: number
): Promise<AdminTodayMenuStatisticResponse[]> => {
  const response = await apiClient.get<AdminTodayMenuStatisticResponse[] | { data: AdminTodayMenuStatisticResponse[] }>(
    '/admin/stats/monthly-menu',
    {
      params: { year, month },
    }
  )

  return unwrapData(response.data) ?? []
}
