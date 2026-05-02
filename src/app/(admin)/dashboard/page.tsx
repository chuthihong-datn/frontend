'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Bolt, DollarSign, Package, RefreshCw, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import {
  getAdminDailyStatsApi,
  getAdminHourlyStatsApi,
  getAdminMonthlyStatsApi,
  getAdminTodayMenuStatsApi,
  getAdminMonthlyMenuStatsApi,
} from '@/api/adminStatistic'
import { formatPrice } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type {
  AdminDailyStatsResponse,
  AdminHourlyStatsResponse,
  AdminMonthlyStatsResponse,
  AdminTodayMenuStatisticResponse,
} from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function formatDateLabel(rawDate: string): string {
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) {
    return rawDate
  }

  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${day}/${month}`
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  if (!year || !month) {
    return monthKey
  }

  return `${month}/${year}`
}

function normalizeMonthKey(value: string | number, year?: number): string {
  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (/^\d{4}-\d{1,2}$/.test(trimmed)) {
      const [rawYear, rawMonth] = trimmed.split('-')
      return `${rawYear}-${rawMonth.padStart(2, '0')}`
    }

    if (/^\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [rawMonth, rawYear] = trimmed.split('/')
      return `${rawYear}-${rawMonth.padStart(2, '0')}`
    }

    if (/^\d{1,2}$/.test(trimmed) && typeof year === 'number') {
      return `${year}-${trimmed.padStart(2, '0')}`
    }

    return trimmed
  }

  if (typeof year === 'number') {
    return `${year}-${String(value).padStart(2, '0')}`
  }

  return String(value)
}

function monthKeyToIndex(monthKey: string): number | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null
  }

  return year * 12 + (month - 1)
}

function monthIndexToKey(index: number): string {
  const year = Math.floor(index / 12)
  const month = (index % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

function buildContinuousMonthSeries(monthEntries: Array<{ monthKey: string; revenue: number }>): {
  labels: string[]
  values: number[]
} {
  const revenueByIndex = new Map<number, number>()

  monthEntries.forEach((item) => {
    const index = monthKeyToIndex(item.monthKey)
    if (index === null) {
      return
    }

    revenueByIndex.set(index, (revenueByIndex.get(index) ?? 0) + Number(item.revenue || 0))
  })

  const indices = Array.from(revenueByIndex.keys()).sort((a, b) => a - b)
  if (!indices.length) {
    return { labels: [], values: [] }
  }

  const startIndex = indices[0]
  const endIndex = indices[indices.length - 1]
  const labels: string[] = []
  const values: number[] = []

  for (let index = startIndex; index <= endIndex; index += 1) {
    labels.push(formatMonthLabel(monthIndexToKey(index)))
    values.push(revenueByIndex.get(index) ?? 0)
  }

  return { labels, values }
}

type TrendMode = 'hour' | 'day' | 'month'

type DayType = 'normal' | 'weekend' | 'holiday'

function getJdn(day: number, month: number, year: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  return jdn
}

function getNewMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  const dr = Math.PI / 180
  let jd1 =
    2415020.75933 +
    29.53058868 * k +
    0.0001178 * T2 -
    0.000000155 * T3 +
    0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
  const C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M) -
    0.4068 * Math.sin(Mpr * dr) +
    0.0161 * Math.sin(dr * 2 * Mpr) -
    0.0004 * Math.sin(dr * 3 * Mpr) +
    0.0104 * Math.sin(dr * 2 * F) -
    0.0051 * Math.sin(dr * (M + Mpr)) -
    0.0074 * Math.sin(dr * (M - Mpr)) +
    0.0004 * Math.sin(dr * (2 * F + M)) -
    0.0004 * Math.sin(dr * (2 * F - M)) -
    0.0006 * Math.sin(dr * (2 * F + Mpr)) +
    0.001 * Math.sin(dr * (2 * F - Mpr)) +
    0.0005 * Math.sin(dr * (2 * Mpr + M))
  let deltat = 0
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
  }
  jd1 = jd1 + C1 - deltat
  return Math.floor(jd1 + 0.5 + timeZone / 24)
}

function getSunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525
  const T2 = T * T
  const dr = Math.PI / 180
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M)
  let L = L0 + DL
  L = L * dr
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2))
  return Math.floor((L / Math.PI) * 6)
}

function getLunarMonth11(year: number, timeZone: number): number {
  const off = getJdn(31, 12, year) - 2415021
  const k = Math.floor(off / 29.530588853)
  let nm = getNewMoonDay(k, timeZone)
  const sunLong = getSunLongitude(nm, timeZone)
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone)
  }
  return nm
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853)
  let last = 0
  let i = 1
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  do {
    last = arc
    i += 1
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  } while (arc !== last && i < 14)
  return i - 1
}

function convertSolarToLunar(date: Date, timeZone = 7): { day: number; month: number; year: number } {
  const dd = date.getDate()
  const mm = date.getMonth() + 1
  const yy = date.getFullYear()
  const dayNumber = getJdn(dd, mm, yy)
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853)
  let monthStart = getNewMoonDay(k + 1, timeZone)
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone)
  }

  let a11 = getLunarMonth11(yy, timeZone)
  let b11 = a11
  let lunarYear = 0
  if (a11 >= monthStart) {
    lunarYear = yy
    a11 = getLunarMonth11(yy - 1, timeZone)
  } else {
    lunarYear = yy + 1
    b11 = getLunarMonth11(yy + 1, timeZone)
  }

  const lunarDay = dayNumber - monthStart + 1
  const diff = Math.floor((monthStart - a11) / 29)
  let lunarMonth = diff + 11
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone)
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10
    }
  }

  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1
  }

  return { day: lunarDay, month: lunarMonth, year: lunarYear }
}

function isVietnamHoliday(date: Date): boolean {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const fixedHoliday =
    (day === 1 && month === 1) ||
    (day === 30 && month === 4) ||
    (day === 1 && month === 5) ||
    (day === 2 && month === 9)
  if (fixedHoliday) {
    return true
  }

  const lunar = convertSolarToLunar(date)
  const isTet = lunar.month === 1 && lunar.day >= 1 && lunar.day <= 3
  const isGioTo = lunar.month === 3 && lunar.day === 10
  return isTet || isGioTo
}

function classifyDay(dateString: string): DayType {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return 'normal'
  }

  if (isVietnamHoliday(date)) {
    return 'holiday'
  }

  const weekDay = date.getDay()
  if (weekDay === 0 || weekDay === 6) {
    return 'weekend'
  }

  return 'normal'
}

export default function DashboardPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [dailyStats, setDailyStats] = useState<AdminDailyStatsResponse[]>([])
  const [hourlyStats, setHourlyStats] = useState<AdminHourlyStatsResponse[]>([])
  const [monthlyStats, setMonthlyStats] = useState<AdminMonthlyStatsResponse[]>([])
  const [todayMenuStats, setTodayMenuStats] = useState<AdminTodayMenuStatisticResponse[]>([])
  const [monthlyMenuStats, setMonthlyMenuStats] = useState<AdminTodayMenuStatisticResponse[]>([])
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [loadingMonthlyMenu, setLoadingMonthlyMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [trendMode, setTrendMode] = useState<TrendMode>('month')

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [daily, hourly, monthly, today] = await Promise.all([
        getAdminDailyStatsApi(),
        getAdminHourlyStatsApi(),
        getAdminMonthlyStatsApi(),
        getAdminTodayMenuStatsApi(),
      ])

      setDailyStats(daily)
      setHourlyStats(hourly)
      setMonthlyStats(monthly)
      setTodayMenuStats(today)
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu thống kê dashboard.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    setExportLoading(true)
    try {
      const accessToken = useAuthStore.getState().accessToken
      const res = await fetch(`/api/admin/reports/monthly/${selectedYear}/${selectedMonth}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Không thể xuất báo cáo')
      }

      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition') || res.headers.get('content-disposition') || ''
      const match = cd.match(/filename="?([^";]+)"?/) || []
      const filename = match[1] || `report_${selectedMonth}_${selectedYear}.xlsx`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Báo cáo đã được tải xuống')
    } catch (error: any) {
      toast.error(error?.message || 'Xuất báo cáo thất bại')
    } finally {
      setExportLoading(false)
    }
  }

  const loadMonthlyMenuStats = async (year: number, month: number) => {
    setLoadingMonthlyMenu(true)
    try {
      const data = await getAdminMonthlyMenuStatsApi(year, month)
      setMonthlyMenuStats(data)
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu thống kê tháng.'
      toast.error(message)
    } finally {
      setLoadingMonthlyMenu(false)
    }
  }

  useEffect(() => {
    loadInitialData()
    loadMonthlyMenuStats(selectedYear, selectedMonth)
  }, [])

  useEffect(() => {
    loadMonthlyMenuStats(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  const totalRevenue = useMemo(
    () => dailyStats.reduce((total, item) => total + Number(item.revenue || 0), 0),
    [dailyStats]
  )

  const todayRevenue = useMemo(() => {
    const latest = dailyStats[dailyStats.length - 1]
    return Number(latest?.revenue || 0)
  }, [dailyStats])

  const totalOrders = useMemo(
    () => dailyStats.reduce((total, item) => total + Number(item.orderCount || 0), 0),
    [dailyStats]
  )

  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  const monthlyRevenueFallbackFromDaily = useMemo(() => {
    const monthRevenueMap = new Map<string, number>()

    dailyStats.forEach((item) => {
      const date = new Date(item.date)
      if (Number.isNaN(date.getTime())) {
        return
      }

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthRevenueMap.set(monthKey, (monthRevenueMap.get(monthKey) ?? 0) + Number(item.revenue || 0))
    })

    return Array.from(monthRevenueMap.entries()).map(([monthKey, revenue]) => ({ monthKey, revenue }))
  }, [dailyStats])

  const monthlyRevenueChartData = useMemo(() => {
    const monthEntries = monthlyStats.length
      ? monthlyStats.map((item) => ({
          monthKey: normalizeMonthKey(item.month, item.year),
          revenue: Number(item.revenue || 0),
        }))
      : monthlyRevenueFallbackFromDaily

    return buildContinuousMonthSeries(monthEntries)
  }, [monthlyRevenueFallbackFromDaily, monthlyStats])

  const selectedTrend = useMemo(() => {
    if (trendMode === 'hour') {
      return {
        title: 'Doanh thu theo giờ',
        description: 'Theo dõi khung giờ mang lại doanh thu tốt nhất trong ngày.',
        label: 'Doanh thu theo giờ',
        labels: hourlyStats.map((item) => formatHourLabel(Number(item.hour || 0))),
        values: hourlyStats.map((item) => Number(item.revenue || 0)),
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.15)',
        tickColors: hourlyStats.map(() => '#64748b'),
      }
    }

    if (trendMode === 'day') {
      const dayTypes = dailyStats.map((item) => classifyDay(item.date))
      return {
        title: 'Doanh thu theo ngày',
        description: 'Quan sát xu hướng doanh thu theo từng ngày.',
        label: 'Doanh thu theo ngày',
        labels: dailyStats.map((item) => formatDateLabel(item.date)),
        values: dailyStats.map((item) => Number(item.revenue || 0)),
        borderColor: '#0EA5E9',
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        tickColors: dayTypes.map((type) => {
          if (type === 'holiday') {
            return '#2563EB'
          }
          if (type === 'weekend') {
            return '#DC2626'
          }
          return '#64748b'
        }),
      }
    }

    return {
      title: 'Doanh thu theo tháng',
      description: 'Dữ liệu doanh thu theo tháng từ hệ thống.',
      label: 'Doanh thu theo tháng',
      labels: monthlyRevenueChartData.labels,
      values: monthlyRevenueChartData.values,
      borderColor: '#7C3AED',
      backgroundColor: 'rgba(124, 58, 237, 0.15)',
      tickColors: monthlyRevenueChartData.labels.map(() => '#64748b'),
    }
  }, [dailyStats, hourlyStats, monthlyRevenueChartData, trendMode])

  const lineChartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatPrice(Number(context.parsed.y ?? 0))}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: (ctx) => selectedTrend.tickColors[ctx.index] ?? '#64748b',
          },
        },
        y: {
          beginAtZero: trendMode === 'month',
          ticks: {
            callback: (value) => formatPrice(Number(value)),
          },
        },
      },
    }),
    [selectedTrend.tickColors, trendMode]
  )

  const selectedTrendChartData = useMemo(
    () => ({
      labels: selectedTrend.labels,
      datasets: [
        {
          label: selectedTrend.label,
          data: selectedTrend.values,
          borderColor: selectedTrend.borderColor,
          backgroundColor: selectedTrend.backgroundColor,
          borderWidth: 2,
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [selectedTrend]
  )

  const statCards = [
    {
      label: 'Doanh thu hôm nay',
      value: formatPrice(todayRevenue),
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary-50',
    },
    {
      label: 'Tổng doanh thu',
      value: formatPrice(totalRevenue),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Tổng đơn hàng',
      value: totalOrders.toLocaleString('vi-VN'),
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Giá trị đơn TB',
      value: formatPrice(averageOrderValue),
      icon: Bolt,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard thống kê</h1>
          <p className="text-sm text-secondary-500 mt-1">Cập nhật theo dữ liệu realtime từ hệ thống.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadInitialData}
            disabled={loading}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={exportLoading}
              className="rounded-lg border border-border bg-white px-2 py-1 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={exportLoading}
              className="rounded-lg border border-border bg-white px-2 py-1 text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={exportReport}
              disabled={exportLoading}
              className="btn btn-primary btn-sm"
            >
              {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Xuất báo cáo'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-secondary-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-secondary-900 mb-1">{selectedTrend.title}</h2>
            <p className="text-sm text-secondary-500">{selectedTrend.description}</p>
          </div>
          <select
            value={trendMode}
            onChange={(event) => setTrendMode(event.target.value as TrendMode)}
            className="min-w-[170px] rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-secondary-700 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="month">Theo tháng</option>
            <option value="day">Theo ngày</option>
            <option value="hour">Theo giờ</option>
          </select>
        </div>
        <div className="h-[340px]">
          <Line data={selectedTrendChartData} options={lineChartOptions} />
        </div>
        {trendMode === 'day' && (
          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
            <div className="flex items-center gap-2 text-secondary-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
              Thứ 7, Chủ nhật
            </div>
            <div className="flex items-center gap-2 text-secondary-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
              Ngày lễ
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-secondary-900 mb-2">Số lượng món đã bán hôm nay</h3>
          <p className="text-xs text-secondary-500 mb-4">Thống kê chi tiết các món bán được trong ngày hôm nay.</p>
          <div className="space-y-2">
            {todayMenuStats.length > 0 ? (
              todayMenuStats.map((item) => (
                <div
                  key={`today-${item.menuId}`}
                  className="flex items-center justify-between rounded-lg bg-secondary-50 px-3 py-2 hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-800 font-medium line-clamp-1">{item.menuName}</p>
                  </div>
                  <span className="ml-2 text-sm font-semibold text-emerald-700 whitespace-nowrap">
                    {item.totalQuantity} món
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-secondary-500 py-8 text-center">Chưa có dữ liệu bán hôm nay.</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="font-semibold text-secondary-900 mb-1">Số lượng món đã bán trong tháng: </h3>
              <p className="text-xs text-secondary-500">Thống kê chi tiết các món bán được trong tháng được chọn.</p>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disabled={loadingMonthlyMenu}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-secondary-700 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disabled={loadingMonthlyMenu}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-secondary-700 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {monthlyMenuStats.length > 0 ? (
              monthlyMenuStats.map((item) => (
                <div
                  key={`monthly-${item.menuId}`}
                  className="flex items-center justify-between rounded-lg bg-secondary-50 px-3 py-2 hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-800 font-medium line-clamp-1">{item.menuName}</p>
                  </div>
                  <span className="ml-2 text-sm font-semibold text-blue-700 whitespace-nowrap">
                    {item.totalQuantity} món
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-secondary-500 py-8 text-center">
                {loadingMonthlyMenu ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu bán tháng này.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
