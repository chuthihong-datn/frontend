'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { getAdminWardsApi, searchAdminWardsApi, updateAdminWardApi } from '@/api/ward'
import type { AdminWardRequest, AdminWardResponse } from '@/types'

type WardStatus = 'delivery' | 'blocked'

type WardItem = {
	id: number | string
	wardCode: string
	name: string
	shippingFee: number
	status: WardStatus
	createdAt: string
	updatedAt: string
}

type ModalMode = 'edit' | null

type WardFormValues = {
	wardCode: string
	name: string
	shippingFee: string
	isDelivery: boolean
}

type WardFormErrors = {
	shippingFee?: string
}

const EMPTY_FORM: WardFormValues = {
	wardCode: '',
	name: '',
	shippingFee: '15000',
	isDelivery: true,
}

function formatDateTime(value: string | null): string {
	if (!value) {
		return '--'
	}

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return value.replace('T', ' ').slice(0, 16)
	}

	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const day = `${date.getDate()}`.padStart(2, '0')
	const hours = `${date.getHours()}`.padStart(2, '0')
	const minutes = `${date.getMinutes()}`.padStart(2, '0')

	return `${year}-${month}-${day} ${hours}:${minutes}`
}

function formatCurrency(value: number): string {
	return `${Number(value || 0).toLocaleString('vi-VN')} đ`
}

function mapApiWard(item: AdminWardResponse): WardItem {
	return {
		id: item.wardId,
		wardCode: item.wardCode,
		name: item.name,
		shippingFee: Number(item.shippingFee || 0),
		status: item.isDelivery ? 'delivery' : 'blocked',
		createdAt: formatDateTime(item.createdAt),
		updatedAt: formatDateTime(item.updatedAt),
	}
}

function validateForm(values: WardFormValues): WardFormErrors {
	const errors: WardFormErrors = {}

	if (!values.shippingFee.trim()) {
		errors.shippingFee = 'Phí giao hàng là bắt buộc.'
	} else {
		const parsed = Number(values.shippingFee)
		if (Number.isNaN(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
			errors.shippingFee = 'Phí giao hàng phải là số nguyên không âm.'
		}
	}

	return errors
}

export default function AdminDeliveryAddressPage() {
	const [allWards, setAllWards] = useState<WardItem[]>([])
	const [wards, setWards] = useState<WardItem[]>([])
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [query, setQuery] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [modalMode, setModalMode] = useState<ModalMode>(null)
	const [editingWard, setEditingWard] = useState<WardItem | null>(null)
	const [formValues, setFormValues] = useState<WardFormValues>(EMPTY_FORM)
	const [formErrors, setFormErrors] = useState<WardFormErrors>({})

	const itemsPerPage = 10

	const deliveryCount = useMemo(
		() => allWards.filter((item) => item.status === 'delivery').length,
		[allWards]
	)
	const blockedCount = allWards.length - deliveryCount
	const totalPages = Math.max(1, Math.ceil(wards.length / itemsPerPage))
	const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)
	const paginatedWards = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		return wards.slice(startIndex, startIndex + itemsPerPage)
	}, [wards, currentPage])

	const loadWards = async () => {
		setLoading(true)
		try {
			const response = await getAdminWardsApi()
			const mapped = response.map(mapApiWard)
			setAllWards(mapped)
			setWards(mapped)
			setCurrentPage(1)
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || 'Không thể tải danh sách địa chỉ giao hàng.'
			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	const searchWards = async (keyword: string) => {
		setLoading(true)
		try {
			const response = await searchAdminWardsApi(keyword)
			setWards(response.map(mapApiWard))
			setCurrentPage(1)
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || 'Không thể tìm kiếm địa chỉ giao hàng.'
			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadWards()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			const keyword = query.trim()
			if (!keyword) {
				setWards(allWards)
				setCurrentPage(1)
				return
			}

			searchWards(keyword)
		}, 350)

		return () => clearTimeout(timeoutId)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query, allWards])

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const closeFormModal = () => {
		setModalMode(null)
		setEditingWard(null)
		setFormErrors({})
		setFormValues(EMPTY_FORM)
	}

	const openEditModal = (ward: WardItem) => {
		setEditingWard(ward)
		setFormErrors({})
		setFormValues({
			wardCode: ward.wardCode,
			name: ward.name,
			shippingFee: String(ward.shippingFee),
			isDelivery: ward.status === 'delivery',
		})
		setModalMode('edit')
	}

	const handleSubmit = async () => {
		const errors = validateForm(formValues)
		setFormErrors(errors)

		if (Object.keys(errors).length > 0) {
			toast.error('Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.')
			return
		}

		if (!editingWard || modalMode !== 'edit') {
			return
		}

		setSubmitting(true)
		try {
			const payload: AdminWardRequest = {
				shippingFee: Number(formValues.shippingFee),
				isDelivery: formValues.isDelivery,
			}

			const updated = await updateAdminWardApi(editingWard.id, payload)
			const mapped = mapApiWard(updated)
			setAllWards((prev) => prev.map((item) => (item.id === editingWard.id ? mapped : item)))
			setWards((prev) => prev.map((item) => (item.id === editingWard.id ? mapped : item)))
			toast.success('Cập nhật địa chỉ giao hàng thành công.')
			closeFormModal()
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || 'Không thể lưu địa chỉ giao hàng.'
			toast.error(message)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="space-y-6">
			<section className="card p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-secondary-900">Quản lý địa chỉ giao hàng</h2>
						<p className="mt-1 text-sm text-secondary-500">
							Quản trị viên chỉ được sửa phí ship và trạng thái giao hàng của khu vực.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={loadWards} className="btn btn-outline btn-sm">
							<RefreshCw className="w-4 h-4" />
							Tải lại
						</button>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
					<div className="rounded-xl border border-border bg-secondary-50 p-3">
						<p className="text-xs text-secondary-500">Tổng địa chỉ</p>
						<p className="text-2xl font-bold text-secondary-900">{allWards.length}</p>
					</div>
					<div className="rounded-xl border border-border bg-emerald-50 p-3">
						<p className="text-xs text-emerald-700">Đang giao được</p>
						<p className="text-2xl font-bold text-emerald-700">{deliveryCount}</p>
					</div>
					<div className="rounded-xl border border-border bg-amber-50 p-3">
						<p className="text-xs text-amber-700">Tạm ngưng giao</p>
						<p className="text-2xl font-bold text-amber-700">{blockedCount}</p>
					</div>
				</div>
			</section>

			<section className="card p-5">
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h3 className="font-semibold text-secondary-900">Danh sách địa chỉ giao hàng tại Hà Nội</h3>
					<div className="relative sm:w-96">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Tìm theo mã hoặc tên địa chỉ"
							className="input pl-9"
						/>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-[900px] w-full text-sm">
						<thead>
							<tr className="border-b border-border text-secondary-500">
								<th className="px-2 py-3 text-left font-medium">ID</th>
								<th className="px-2 py-3 text-left font-medium">Tên khu vực</th>
								<th className="px-2 py-3 text-left font-medium">Phí giao hàng</th>
								<th className="px-2 py-3 text-left font-medium">Trạng thái giao</th>
								<th className="px-2 py-3 text-left font-medium">Cập nhật</th>
								<th className="px-2 py-3 text-left font-medium">Sửa</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={6}>
										Đang tải danh sách địa chỉ...
									</td>
								</tr>
							) : paginatedWards.length === 0 ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={6}>
										Không có địa chỉ phù hợp.
									</td>
								</tr>
							) : (
								paginatedWards.map((ward) => (
									<tr key={ward.id} className="border-b border-border last:border-0 hover:bg-secondary-50">
										<td className="px-2 py-3 font-semibold text-secondary-700">#{ward.id}</td>
										<td className="px-2 py-3 font-medium text-secondary-900">{ward.name}</td>
										<td className="px-2 py-3 text-secondary-700">{formatCurrency(ward.shippingFee)}</td>
										<td className="px-2 py-3">
											<span
												className={`badge ${ward.status === 'delivery' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
											>
												{ward.status === 'delivery' ? 'Cho phép giao' : 'Tạm ngưng'}
											</span>
										</td>
										<td className="px-2 py-3 text-secondary-500">{ward.updatedAt}</td>
										<td className="px-2 py-3">
											<button type="button" onClick={() => openEditModal(ward)} className="btn btn-ghost btn-sm">
												<Pencil className="h-4 w-4" />
												Sửa
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{wards.length > 0 && !loading && (
					<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-secondary-500">
							Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
							{Math.min(currentPage * itemsPerPage, wards.length)} / {wards.length} địa chỉ
						</p>
						<div className="flex items-center justify-center gap-1">
							<button
								type="button"
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-secondary-100 disabled:pointer-events-none disabled:opacity-40"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>

							{pages.map((page) => (
								<button
									key={page}
									type="button"
									onClick={() => setCurrentPage(page)}
									className={`h-8 w-8 rounded-xl text-sm font-medium transition-all ${currentPage === page ? 'bg-primary text-white shadow-sm' : 'text-secondary-700 hover:bg-secondary-100'}`}
								>
									{page}
								</button>
							))}

							{totalPages > 5 && <span className="px-1 text-secondary-400">...</span>}

							{totalPages > 5 && (
								<button
									type="button"
									onClick={() => setCurrentPage(totalPages)}
									className={`h-8 w-8 rounded-xl text-sm font-medium transition-all ${currentPage === totalPages ? 'bg-primary text-white shadow-sm' : 'text-secondary-700 hover:bg-secondary-100'}`}
								>
									{totalPages}
								</button>
							)}

							<button
								type="button"
								onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
								disabled={currentPage === totalPages}
								className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-secondary-100 disabled:pointer-events-none disabled:opacity-40"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}
			</section>

			{modalMode && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
						<div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
							<div>
								<h3 className="text-lg font-semibold text-secondary-900">Sửa địa chỉ giao hàng</h3>
								<p className="mt-1 text-sm text-secondary-500">
									Chỉ cho phép chỉnh phí ship và trạng thái giao hàng.
								</p>
							</div>
							<button type="button" onClick={closeFormModal} className="btn btn-ghost btn-sm">
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="space-y-4 p-6">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="text-sm font-medium text-secondary-700">Mã khu vực</label>
									<input value={formValues.wardCode} className="input mt-1" disabled />
								</div>
								<div>
									<label className="text-sm font-medium text-secondary-700">Tên khu vực</label>
									<input value={formValues.name} className="input mt-1" disabled />
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="text-sm font-medium text-secondary-700">
										Phí giao hàng (đ) <span className="text-red-600">*</span>
									</label>
									<input
										type="number"
										min={0}
										value={formValues.shippingFee}
										onChange={(event) =>
											setFormValues((prev) => ({ ...prev, shippingFee: event.target.value }))
										}
										className={`input mt-1 ${formErrors.shippingFee ? 'input-error' : ''}`}
										placeholder="15000"
									/>
									{formErrors.shippingFee && <p className="mt-1 text-xs text-red-600">{formErrors.shippingFee}</p>}
								</div>

								<div>
									<label className="text-sm font-medium text-secondary-700">Trạng thái giao hàng</label>
									<select
										value={formValues.isDelivery ? 'delivery' : 'blocked'}
										onChange={(event) =>
											setFormValues((prev) => ({
												...prev,
												isDelivery: event.target.value === 'delivery',
											}))
										}
										className="input mt-1"
									>
										<option value="delivery">Cho phép giao</option>
										<option value="blocked">Tạm ngưng giao</option>
									</select>
								</div>
							</div>
						</div>

						<div className="flex justify-end gap-2 border-t border-border bg-white px-6 py-4">
							<button type="button" onClick={closeFormModal} className="btn btn-outline btn-sm">
								Hủy bỏ
							</button>
							<button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-primary btn-sm">
								Sửa
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}