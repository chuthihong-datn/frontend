'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
	createAdminToppingApi,
	getAdminToppingsApi,
	searchAdminToppingsApi,
	updateAdminToppingApi,
} from '@/api/adminTopping'
import type { AdminToppingResponse } from '@/types'

type ToppingStatus = 'active' | 'inactive'

type Topping = {
	id: number
	name: string
	price: number
	status: ToppingStatus
	outOfStock: boolean
	updatedAt: string
}

type ToppingFormValues = {
	name: string
	price: string
	status: ToppingStatus
	outOfStock: boolean
}

type ToppingFormErrors = Partial<Record<keyof ToppingFormValues, string>>

type ModalMode = 'create' | 'edit' | null

const EMPTY_FORM: ToppingFormValues = {
	name: '',
	price: '',
	status: 'active',
	outOfStock: false,
}

function formatDateTime(date = new Date()): string {
	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const day = `${date.getDate()}`.padStart(2, '0')
	const hours = `${date.getHours()}`.padStart(2, '0')
	const minutes = `${date.getMinutes()}`.padStart(2, '0')
	return `${year}-${month}-${day} ${hours}:${minutes}`
}

function formatPrice(value: number): string {
	return `${value.toLocaleString('vi-VN')} đ`
}

function validateForm(values: ToppingFormValues): ToppingFormErrors {
	const errors: ToppingFormErrors = {}

	if (!values.name.trim()) {
		errors.name = 'Tên topping là bắt buộc.'
	}

	if (!values.price.trim()) {
		errors.price = 'Giá topping là bắt buộc.'
	} else {
		const parsed = Number(values.price)
		if (Number.isNaN(parsed) || parsed <= 0) {
			errors.price = 'Giá topping phải lớn hơn 0.'
		}
	}

	return errors
}

function mapApiTopping(item: AdminToppingResponse, updatedAt = '--'): Topping {
	return {
		id: Number(item.toppingId),
		name: item.name,
		price: Number(item.price),
		status: item.isActive ? 'active' : 'inactive',
		outOfStock: Boolean(item.outOfStock),
		updatedAt,
	}
}

export default function AdminToppingPage() {
	const [allToppings, setAllToppings] = useState<Topping[]>([])
	const [toppings, setToppings] = useState<Topping[]>([])
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [query, setQuery] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const hasMountedSearch = useRef(false)
	const [modalMode, setModalMode] = useState<ModalMode>(null)
	const [editingTopping, setEditingTopping] = useState<Topping | null>(null)
	const [deletingTopping, setDeletingTopping] = useState<Topping | null>(null)
	const [formValues, setFormValues] = useState<ToppingFormValues>(EMPTY_FORM)
	const [formErrors, setFormErrors] = useState<ToppingFormErrors>({})

	const activeCount = useMemo(
		() => allToppings.filter((item) => item.status === 'active').length,
		[allToppings]
	)
	const inactiveCount = allToppings.length - activeCount
	const outOfStockCount = useMemo(
		() => allToppings.filter((item) => item.outOfStock).length,
		[allToppings]
	)
	const itemsPerPage = 10
	const totalPages = Math.max(1, Math.ceil(toppings.length / itemsPerPage))
	const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)
	const paginatedToppings = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		return toppings.slice(startIndex, startIndex + itemsPerPage)
	}, [toppings, currentPage])

	const loadToppings = async () => {
		setLoading(true)
		try {
			const response = await getAdminToppingsApi()
			const mapped = response.map((item) => mapApiTopping(item))
			setAllToppings(mapped)
			setToppings(mapped)
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể tải danh sách topping')
		} finally {
			setLoading(false)
		}
	}

	const searchToppings = async (keyword?: string) => {
		setLoading(true)
		try {
			const response = keyword
				? await searchAdminToppingsApi(keyword)
				: await getAdminToppingsApi()
			const mapped = response.map((item) => mapApiTopping(item))
			setToppings(mapped)
			if (!keyword) {
				setAllToppings(mapped)
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể tìm kiếm topping')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadToppings()
	}, [])

	useEffect(() => {
		if (!hasMountedSearch.current) {
			hasMountedSearch.current = true
			return
		}

		const timeoutId = setTimeout(() => {
			const keyword = query.trim()
			if (!keyword) {
				loadToppings()
				return
			}
			searchToppings(keyword)
		}, 350)

		return () => clearTimeout(timeoutId)
	}, [query])

	useEffect(() => {
		setCurrentPage(1)
	}, [query])

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const openCreateModal = () => {
		setFormValues(EMPTY_FORM)
		setFormErrors({})
		setEditingTopping(null)
		setModalMode('create')
	}

	const openEditModal = (topping: Topping) => {
		setFormValues({
			name: topping.name,
			price: String(topping.price),
			status: topping.status,
			outOfStock: topping.outOfStock,
		})
		setFormErrors({})
		setEditingTopping(topping)
		setModalMode('edit')
	}

	const closeFormModal = () => {
		setModalMode(null)
		setEditingTopping(null)
		setFormErrors({})
	}

	const handleFieldChange = (field: keyof ToppingFormValues, value: string) => {
		setFormValues((prev) => ({ ...prev, [field]: value }))
		if (formErrors[field]) {
			setFormErrors((prev) => ({ ...prev, [field]: undefined }))
		}
	}

	const handleSubmit = async () => {
		const errors = validateForm(formValues)
		setFormErrors(errors)

		if (Object.keys(errors).length > 0) {
			toast.error('Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.')
			return
		}

		const payload = {
			toppingId: editingTopping ? editingTopping.id : undefined,
			name: formValues.name.trim(),
			price: Number(formValues.price),
			isActive: formValues.status === 'active',
			outOfStock: formValues.outOfStock,
		}

		setSubmitting(true)
		try {
			const keyword = query.trim().toLowerCase()

			if (modalMode === 'create') {
				const created = await createAdminToppingApi(payload)
				const mappedCreated = mapApiTopping(created, formatDateTime())
				setAllToppings((prev) => [mappedCreated, ...prev])
				if (!keyword || mappedCreated.name.toLowerCase().includes(keyword)) {
					setToppings((prev) => [mappedCreated, ...prev])
				}
				toast.success('Thêm topping thành công.')
				closeFormModal()
				return
			}

			if (modalMode === 'edit' && editingTopping) {
				const updated = await updateAdminToppingApi(editingTopping.id, payload)
				const mappedUpdated = mapApiTopping(updated, formatDateTime())
				setAllToppings((prev) =>
					prev.map((item) => (item.id === editingTopping.id ? mappedUpdated : item))
				)

				if (!keyword) {
					setToppings((prev) =>
						prev.map((item) => (item.id === editingTopping.id ? mappedUpdated : item))
					)
				} else {
					setToppings((prev) => {
						const withoutOld = prev.filter((item) => item.id !== editingTopping.id)
						if (mappedUpdated.name.toLowerCase().includes(keyword)) {
							return [mappedUpdated, ...withoutOld]
						}
						return withoutOld
					})
				}

				toast.success('Cập nhật topping thành công.')
				closeFormModal()
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể lưu topping')
		} finally {
			setSubmitting(false)
		}
	}

	const openDeleteConfirm = (topping: Topping) => {
		setDeletingTopping(topping)
	}

	const cancelDelete = () => {
		setDeletingTopping(null)
	}

	const confirmDelete = async () => {
		if (!deletingTopping) {
			return
		}

		if (deletingTopping.status === 'inactive') {
			toast.info('Topping này đã ở trạng thái tạm ẩn.')
			setDeletingTopping(null)
			return
		}

		setSubmitting(true)
		try {
			const updated = await updateAdminToppingApi(deletingTopping.id, {
				toppingId: deletingTopping.id,
				name: deletingTopping.name,
				price: deletingTopping.price,
				isActive: false,
				outOfStock: deletingTopping.outOfStock,
			})

			const mappedUpdated = mapApiTopping(updated, formatDateTime())
			setAllToppings((prev) =>
				prev.map((item) => (item.id === deletingTopping.id ? mappedUpdated : item))
			)
			setToppings((prev) =>
				prev.map((item) => (item.id === deletingTopping.id ? mappedUpdated : item))
			)
			setDeletingTopping(null)
			toast.success('Đã chuyển topping sang trạng thái tạm ẩn.')
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái topping')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="space-y-6">
			<section className="card p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-secondary-900">Danh sách topping</h2>
						<p className="text-sm text-secondary-500 mt-1">
							Quản lý topping cho các món ăn.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={loadToppings} className="btn btn-outline btn-sm">
							<RefreshCw className="w-4 h-4" />
							Tải lại
						</button>
						<button type="button" onClick={openCreateModal} className="btn btn-primary btn-sm">
							<Plus className="w-4 h-4" />
							Thêm mới
						</button>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
					<div className="rounded-xl border border-border p-3 bg-secondary-50">
						<p className="text-xs text-secondary-500">Tổng topping</p>
						<p className="text-2xl font-bold text-secondary-900">{allToppings.length}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-emerald-50">
						<p className="text-xs text-emerald-700">Đang hoạt động</p>
						<p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-amber-50">
						<p className="text-xs text-amber-700">Tạm ẩn</p>
						<p className="text-2xl font-bold text-amber-700">{inactiveCount}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-amber-50">
						<p className="text-xs text-amber-700">Hết hàng</p>
						<p className="text-2xl font-bold text-amber-700">{outOfStockCount}</p>
					</div>
				</div>
			</section>

			<section className="card p-5">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<h3 className="font-semibold text-secondary-900">Danh sách topping</h3>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm theo tên topping"
						className="input sm:w-72"
					/>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border text-secondary-500">
								<th className="text-left py-3 px-2 font-medium">ID</th>
								<th className="text-left py-3 px-2 font-medium">Tên topping</th>
								<th className="text-left py-3 px-2 font-medium">Giá</th>
								<th className="text-left py-3 px-2 font-medium">Trạng thái</th>
								<th className="text-left py-3 px-2 font-medium">Kho</th>
								<th className="text-left py-3 px-2 font-medium">Thao tác</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={6}>
										Đang tải dữ liệu topping...
									</td>
								</tr>
							) : toppings.length === 0 ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={6}>
										Không có topping phù hợp.
									</td>
								</tr>
							) : (
								paginatedToppings.map((topping) => (
									<tr key={topping.id} className="border-b border-border last:border-0 hover:bg-secondary-50">
										<td className="py-3 px-2 font-semibold text-secondary-700">#{topping.id}</td>
										<td className="py-3 px-2 font-medium text-secondary-900">{topping.name}</td>
										<td className="py-3 px-2 text-secondary-700">{formatPrice(topping.price)}</td>
										<td className="py-3 px-2">
											<span
												className={cn(
													'badge',
													topping.status === 'active'
														? 'bg-emerald-100 text-emerald-700'
														: 'bg-amber-100 text-amber-700'
												)}
											>
												{topping.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
											</span>
										</td>
										<td className="py-3 px-2">
											<span
												className={cn(
													'badge',
													topping.outOfStock
														? 'bg-red-100 text-red-700'
														: 'bg-green-100 text-green-700'
												)}
											>
												{topping.outOfStock ? 'Hết hàng' : 'Còn hàng'}
											</span>
										</td>
										<td className="py-3 px-2">
											<div className="flex flex-wrap gap-2">
												<button type="button" onClick={() => openEditModal(topping)} className="btn btn-ghost btn-sm">
													<Pencil className="w-4 h-4" />
													Sửa
												</button>

												<button
													type="button"
													onClick={() => openDeleteConfirm(topping)}
													className="btn btn-sm bg-red-50 text-red-700 hover:bg-red-100"
												>
													<Trash2 className="w-4 h-4" />
													Xóa
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{toppings.length > 0 && (
					<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-secondary-500">
							Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
							{Math.min(currentPage * itemsPerPage, toppings.length)} / {toppings.length} topping
						</p>
						<div className="flex items-center justify-center gap-1">
							<button
								type="button"
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>

							{pages.map((page) => (
								<button
									key={page}
									type="button"
									onClick={() => setCurrentPage(page)}
									className={cn(
										'w-8 h-8 rounded-xl text-sm font-medium transition-all',
										currentPage === page
											? 'bg-primary text-white shadow-sm'
											: 'text-secondary-700 hover:bg-secondary-100'
									)}
								>
									{page}
								</button>
							))}

							{totalPages > 5 && <span className="text-secondary-400 px-1">...</span>}

							{totalPages > 5 && (
								<button
									type="button"
									onClick={() => setCurrentPage(totalPages)}
									className={cn(
										'w-8 h-8 rounded-xl text-sm font-medium transition-all',
										currentPage === totalPages
											? 'bg-primary text-white shadow-sm'
											: 'text-secondary-700 hover:bg-secondary-100'
									)}
								>
									{totalPages}
								</button>
							)}
							<button
								type="button"
								onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
								disabled={currentPage === totalPages}
								className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}

				<p className="text-xs text-secondary-500 mt-3">
					Lưu ý: topping được đánh dấu hết hàng sẽ không hiển thị cho khách hàng.
				</p>
			</section>

			{modalMode && (
				<div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl border border-border overflow-hidden w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col">
						<div className="px-6 py-4 border-b border-border">
							<h3 className="text-lg font-semibold text-secondary-900">
								{modalMode === 'create' ? 'Thêm topping mới' : 'Sửa thông tin topping'}
							</h3>
						</div>

						<div className="p-6 space-y-4 overflow-y-auto">
							<div>
								<label className="text-sm font-medium text-secondary-700">Tên topping *</label>
								<input
									value={formValues.name}
									onChange={(event) => handleFieldChange('name', event.target.value)}
									className={cn('input mt-1', formErrors.name && 'input-error')}
									placeholder="Ví dụ: Sốt BBQ"
								/>
								{formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">Giá topping (đ) *</label>
								<input
									type="number"
									min={0}
									value={formValues.price}
									onChange={(event) => handleFieldChange('price', event.target.value)}
									className={cn('input mt-1', formErrors.price && 'input-error')}
									placeholder="10000"
								/>
								{formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">Trạng thái</label>
								<div className="mt-2 flex gap-2">
									<button
										type="button"
										onClick={() => handleFieldChange('status', 'active')}
										className={cn(
											'btn btn-sm',
											formValues.status === 'active'
												? 'bg-emerald-600 text-white hover:bg-emerald-700'
												: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
										)}
									>
										Hoạt động
									</button>
									<button
										type="button"
										onClick={() => handleFieldChange('status', 'inactive')}
										className={cn(
											'btn btn-sm',
											formValues.status === 'inactive'
												? 'bg-amber-600 text-white hover:bg-amber-700'
												: 'bg-amber-50 text-amber-700 hover:bg-amber-100'
										)}
									>
										Tạm ẩn
									</button>
								</div>
							</div>

							{modalMode === 'edit' && (
								<div>
									<label className="text-sm font-medium text-secondary-700">Tình trạng kho</label>
									<div className="mt-2 flex gap-2">
										<button
											type="button"
											onClick={() => setFormValues((prev) => ({ ...prev, outOfStock: false }))}
											className={cn(
												'btn btn-sm',
												!formValues.outOfStock
													? 'bg-green-600 text-white hover:bg-green-700'
													: 'bg-green-50 text-green-700 hover:bg-green-100'
											)}
										>
											Còn hàng
										</button>
										<button
											type="button"
											onClick={() => setFormValues((prev) => ({ ...prev, outOfStock: true }))}
											className={cn(
												'btn btn-sm',
												formValues.outOfStock
													? 'bg-red-600 text-white hover:bg-red-700'
													: 'bg-red-50 text-red-700 hover:bg-red-100'
											)}
										>
											Hết hàng
										</button>
									</div>
								</div>
							)}
						</div>

						<div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-white sticky bottom-0">
							<button type="button" onClick={closeFormModal} className="btn btn-outline btn-sm">
								Hủy bỏ
							</button>
							<button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-primary btn-sm">
								{modalMode === 'create' ? 'Thêm' : 'Sửa'}
							</button>
						</div>
					</div>
				</div>
			)}

			{deletingTopping && (
				<div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
						<div className="flex items-start gap-3">
							<div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-secondary-900">Xác nhận tạm ẩn topping</h3>
								<p className="text-sm text-secondary-500 mt-1">
									Topping <strong>{deletingTopping.name}</strong> sẽ được chuyển sang trạng thái tạm ẩn và vẫn giữ trong danh sách.
								</p>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<button type="button" onClick={cancelDelete} className="btn btn-outline btn-sm">
								Hủy bỏ
							</button>
							<button type="button" onClick={confirmDelete} disabled={submitting} className="btn btn-sm bg-red-600 text-white hover:bg-red-700">
								Tạm ẩn
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
