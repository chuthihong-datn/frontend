"use client"

import { useEffect, useMemo, useState } from 'react'
import { EyeOff, FilterX, RefreshCw, Star } from 'lucide-react'
import { toast } from 'sonner'
import { getAdminMenusApi } from '@/api/adminMenu'
import { getAdminReviewsApi, hideAdminReviewApi } from '@/api/adminReview'
import type { AdminMenuResponse, AdminReviewResponse } from '@/types'

type MenuOption = {
	value: string
	label: string
}

const STAR_OPTIONS = [1, 2, 3, 4, 5]

function formatDateTime(value: string): string {
	if (!value) {
		return '--'
	}

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return value.replace('T', ' ').slice(0, 16)
	}

	const day = `${date.getDate()}`.padStart(2, '0')
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const year = date.getFullYear()
	const hours = `${date.getHours()}`.padStart(2, '0')
	const minutes = `${date.getMinutes()}`.padStart(2, '0')

	return `${day}/${month}/${year} ${hours}:${minutes}`
}

function mapMenuOption(menu: AdminMenuResponse): MenuOption {
	return {
		value: String(menu.menuId),
		label: menu.name,
	}
}

export default function AdminReviewsPage() {
	const [reviews, setReviews] = useState<AdminReviewResponse[]>([])
	const [menus, setMenus] = useState<MenuOption[]>([])
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [selectedMenuId, setSelectedMenuId] = useState('')
	const [selectedRating, setSelectedRating] = useState('')

	const loadMenus = async () => {
		try {
			const menuResult = await getAdminMenusApi()
			setMenus(menuResult.map(mapMenuOption))
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể tải danh sách món ăn.')
		}
	}

	const loadReviews = async () => {
		setLoading(true)
		try {
			const reviewResult = await getAdminReviewsApi(
				selectedMenuId ? Number(selectedMenuId) : null,
				selectedRating ? Number(selectedRating) : null
			)
			setReviews(reviewResult)
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu đánh giá.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadMenus()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		loadReviews()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedMenuId, selectedRating])

	const filteredCount = reviews.length
	const averageRating = useMemo(() => {
		if (reviews.length === 0) {
			return 0
		}

		const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0)
		return total / reviews.length
	}, [reviews])

	const fiveStarCount = useMemo(() => reviews.filter((item) => Number(item.rating) === 5).length, [reviews])
	const activeFilterLabel = useMemo(() => {
		const menuLabel = selectedMenuId ? menus.find((item) => item.value === selectedMenuId)?.label ?? '1 món' : 'Tất cả món'
		const ratingLabel = selectedRating ? `${selectedRating} sao` : 'Tất cả sao'
		return `${menuLabel} • ${ratingLabel}`
	}, [menus, selectedMenuId, selectedRating])

	const handleResetFilters = () => {
		setSelectedMenuId('')
		setSelectedRating('')
	}

	const handleHideReview = async (review: AdminReviewResponse) => {
		const confirmed = window.confirm(`Ẩn review của ${review.userName} cho món ${review.menuName}?`)
		if (!confirmed) return

		setSubmitting(true)
		try {
			await hideAdminReviewApi(review.reviewId)
			setReviews((prev) =>
				prev.map((item) =>
					String(item.reviewId) === String(review.reviewId)
						? { ...item, isDeleted: true }
						: item
				)
			)
			toast.success('Đã ẩn review.')
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể ẩn review.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="space-y-6">
			<section className="card p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-secondary-900">Quản lý đánh giá</h2>
						<p className="mt-1 text-sm text-secondary-500">
							Xem danh sách review, lọc theo món hoặc số sao, và ẩn các đánh giá không phù hợp.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={loadReviews} className="btn btn-outline btn-sm">
							<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
							Tải lại
						</button>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
					<div className="rounded-xl border border-border bg-secondary-50 p-3">
						<p className="text-xs text-secondary-500">Tổng review</p>
						<p className="text-2xl font-bold text-secondary-900">{reviews.length}</p>
					</div>
					<div className="rounded-xl border border-border bg-amber-50 p-3">
						<p className="text-xs text-amber-700">Điểm trung bình</p>
						<p className="text-2xl font-bold text-amber-700">{averageRating.toFixed(1)}</p>
					</div>
					<div className="rounded-xl border border-border bg-emerald-50 p-3">
						<p className="text-xs text-emerald-700">Review 5 sao</p>
						<p className="text-2xl font-bold text-emerald-700">{fiveStarCount}</p>
					</div>
				</div>
			</section>

			<section className="card p-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-end">
					<div className="flex-1">
						<label className="mb-2 block text-sm font-medium text-secondary-700">Lọc theo món</label>
						<select
							value={selectedMenuId}
							onChange={(event) => setSelectedMenuId(event.target.value)}
							className="input-field w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
						>
							<option value="">Tất cả món</option>
							{menus.map((menu) => (
								<option key={menu.value} value={menu.value}>
									{menu.label}
								</option>
							))}
						</select>
					</div>

					<div className="w-full lg:w-56">
						<label className="mb-2 block text-sm font-medium text-secondary-700">Lọc theo số sao</label>
						<select
							value={selectedRating}
							onChange={(event) => setSelectedRating(event.target.value)}
							className="input-field w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
						>
							<option value="">Tất cả</option>
							{STAR_OPTIONS.map((star) => (
								<option key={star} value={star}>
									{star} sao
								</option>
							))}
						</select>
					</div>

					<div className="flex gap-2">
						<button
							type="button"
							onClick={handleResetFilters}
							className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50"
						>
							<FilterX className="h-4 w-4" />
						</button>
					</div>
				</div>
			</section>

			<section className="card p-5">
				<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="font-semibold text-secondary-900">Danh sách đánh giá</h3>
						<p className="text-sm text-secondary-500 mt-1">Bộ lọc hiện tại: {activeFilterLabel}</p>
					</div>
					<p className="text-sm text-secondary-500">Đang hiển thị {filteredCount} review</p>
				</div>

				{loading ? (
					<div className="py-8 text-center text-secondary-500">Đang tải đánh giá...</div>
				) : reviews.length === 0 ? (
					<div className="py-8 text-center text-secondary-500">
						Không có review nào phù hợp với bộ lọc hiện tại.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="mt-4 w-full min-w-[800px] text-sm">
							<colgroup>
								<col className="w-[140px]" />
								<col className="w-[120px]" />
								<col className="w-[80px]" />
								<col className="w-[260px]" />
								<col className="w-[130px]" />
								<col className="w-[100px]" />
							</colgroup>
							<thead>
								<tr>
									<th className="border-b border-border px-2 py-3 text-left font-medium text-secondary-500">Món ăn</th>
									<th className="border-b border-border px-2 py-3 text-left font-medium text-secondary-500">Người đánh giá</th>
									<th className="border-b border-border px-2 py-3 text-left font-medium text-secondary-500">Số sao</th>
									<th className="border-b border-border px-2 py-3 text-left font-medium text-secondary-500">Nội dung</th>
									<th className="border-b border-border px-2 py-3 text-left font-medium text-secondary-500">Ngày tạo</th>
									<th className="border-b border-border px-2 py-3 text-left font-medium text-secondary-500">Thao tác</th>
								</tr>
							</thead>
							<tbody>
								{reviews.map((review) => (
									<tr key={review.reviewId} className="border-b border-border last:border-0 hover:bg-secondary-50">
										<td className="px-2 py-3 align-top">
											<div className="font-medium text-secondary-900">{review.menuName}</div>

										</td>
										<td className="px-2 py-3 align-top text-secondary-700">{review.userName}</td>
										<td className="px-2 py-3 align-top">
											<div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
												<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
												<span className="font-semibold">{review.rating.toFixed(1)}</span>
											</div>
										</td>
										<td className="px-2 py-3 align-top text-secondary-700">
											<p className="line-clamp-3 whitespace-pre-wrap">{review.comment || 'Không có bình luận.'}</p>
										</td>
										<td className="px-2 py-3 align-top text-secondary-600">{formatDateTime(review.createdAt)}</td>
										<td className="px-2 py-3 align-top">
											<button
												type="button"
												onClick={() => handleHideReview(review)}
												disabled={submitting || review.isDeleted}
												className="btn btn-sm bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
												title="Ẩn review"
											>
												<EyeOff className="h-3.5 w-3.5" />
												{review.isDeleted ? 'Đã ẩn' : 'Ẩn'}
											</button>
										</td>
									</tr>
								))}
							</tbody>
							</table>
						</div>
					)}
				</section>
			</div>
	)
}
