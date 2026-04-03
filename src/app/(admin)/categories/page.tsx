'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ImagePlus, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
	createAdminCategoryApi,
	getAdminCategoriesApi,
	searchAdminCategoriesApi,
	updateAdminCategoryApi,
} from '@/api/adminCategory'
import type { AdminCategoryResponse } from '@/types'
type CategoryStatus = 'active' | 'inactive'

type Category = {
	id: number | string
	name: string
	iconUrl: string
	description: string
	status: CategoryStatus
	updatedAt: string
}

type FormValues = {
	name: string
	iconUrl: string
	description: string
	status: CategoryStatus
}

type FormErrors = Partial<Record<keyof FormValues, string>>

type ModalMode = 'create' | 'edit' | null

const EMPTY_FORM: FormValues = {
	name: '',
	iconUrl: '',
	description: '',
	status: 'active',
}

function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result)
				return
			}
			reject(new Error('Không thể đọc tệp ảnh'))
		}
		reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'))
		reader.readAsDataURL(file)
	})
}

function formatApiDateTime(value: string | null): string {
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

function mapApiCategory(item: AdminCategoryResponse): Category {
	return {
		id: item.categoryId,
		name: item.name,
		iconUrl: item.iconUrl ?? '',
		description: item.description ?? '',
		status: item.isActive ? 'active' : 'inactive',
		updatedAt: formatApiDateTime(item.updatedAt),
	}
}

function validateForm(values: FormValues): FormErrors {
	const errors: FormErrors = {}

	if (!values.name.trim()) {
		errors.name = 'Tên danh mục là bắt buộc.'
	}

	if (!values.iconUrl.trim()) {
		errors.iconUrl = 'Vui lòng tải icon danh mục.'
	}

	if (!values.description.trim()) {
		errors.description = 'Mô tả là bắt buộc.'
	}

	return errors
}

export default function AdminCategoriesPage() {
	const [allCategories, setAllCategories] = useState<Category[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [query, setQuery] = useState('')
	const [iconFile, setIconFile] = useState<File | null>(null)
	const hasMountedSearch = useRef(false)

	const [modalMode, setModalMode] = useState<ModalMode>(null)
	const [editingCategory, setEditingCategory] = useState<Category | null>(null)
	const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

	const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM)
	const [formErrors, setFormErrors] = useState<FormErrors>({})

	const activeCount = useMemo(
		() => allCategories.filter((item) => item.status === 'active').length,
		[allCategories]
	)

	const inactiveCount = allCategories.length - activeCount

	const loadCategories = async () => {
		setLoading(true)
		try {
			const response = await getAdminCategoriesApi()
			const mapped = response.map(mapApiCategory)
			setAllCategories(mapped)
			setCategories(mapped)
		} catch (error: any) {
			const message =
				error?.response?.data?.message || error?.message || 'Không thể tải danh mục từ hệ thống'
			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	const searchCategories = async (keyword?: string) => {
		setLoading(true)
		try {
			const response = keyword
				? await searchAdminCategoriesApi(keyword)
				: await getAdminCategoriesApi()
			const mapped = response.map(mapApiCategory)
			setCategories(mapped)
			if (!keyword) {
				setAllCategories(mapped)
			}
		} catch (error: any) {
			const message =
				error?.response?.data?.message || error?.message || 'Không thể tìm kiếm danh mục'
			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadCategories()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		if (!hasMountedSearch.current) {
			hasMountedSearch.current = true
			return
		}

		const timeoutId = setTimeout(() => {
			const keyword = query.trim()
			if (!keyword) {
				loadCategories()
				return
			}
			searchCategories(keyword)
		}, 400)

		return () => clearTimeout(timeoutId)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query])

	const openCreateModal = () => {
		setFormValues(EMPTY_FORM)
		setIconFile(null)
		setFormErrors({})
		setEditingCategory(null)
		setModalMode('create')
	}

	const openEditModal = (category: Category) => {
		setFormValues({
			name: category.name,
			iconUrl: category.iconUrl,
			description: category.description,
			status: category.status,
		})
		setIconFile(null)
		setFormErrors({})
		setEditingCategory(category)
		setModalMode('edit')
	}

	const closeFormModal = () => {
		setModalMode(null)
		setIconFile(null)
		setEditingCategory(null)
		setFormErrors({})
	}

	const onChangeField = (field: keyof FormValues, value: string) => {
		setFormValues((prev) => ({ ...prev, [field]: value }))
		if (formErrors[field]) {
			setFormErrors((prev) => ({ ...prev, [field]: undefined }))
		}
	}

	const handleUploadIcon = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) {
			return
		}

		if (!file.type.startsWith('image/')) {
			toast.error('Vui lòng chọn tệp hình ảnh hợp lệ.')
			event.target.value = ''
			return
		}

		if (file.size > 2 * 1024 * 1024) {
			toast.error('Ảnh icon phải nhỏ hơn 2MB.')
			event.target.value = ''
			return
		}

		try {
			const dataUrl = await readFileAsDataUrl(file)
			setIconFile(file)
			setFormValues((prev) => ({ ...prev, iconUrl: dataUrl }))
			if (formErrors.iconUrl) {
				setFormErrors((prev) => ({ ...prev, iconUrl: undefined }))
			}
		} catch {
			toast.error('Không thể tải ảnh. Vui lòng thử lại.')
		} finally {
			event.target.value = ''
		}
	}

	const handleClearIcon = () => {
		setIconFile(null)
		setFormValues((prev) => ({ ...prev, iconUrl: '' }))
	}

	const handleSubmitForm = async () => {
		const errors = validateForm(formValues)
		setFormErrors(errors)

		if (Object.keys(errors).length > 0) {
			toast.error('Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.')
			return
		}

		setSubmitting(true)
		try {
			const currentKeyword = query.trim().toLowerCase()
			const payload = {
				name: formValues.name.trim(),
				description: formValues.description.trim(),
				isActive: formValues.status === 'active',
			}

			if (modalMode === 'create') {
				const created = await createAdminCategoryApi(payload, iconFile)
				const mappedCreated = mapApiCategory(created)
				setAllCategories((prev) => [mappedCreated, ...prev])

				if (!currentKeyword || mappedCreated.name.toLowerCase().includes(currentKeyword)) {
					setCategories((prev) => [mappedCreated, ...prev])
				}
				toast.success('Thêm danh mục thành công.')
			}

			if (modalMode === 'edit' && editingCategory) {
				const updated = await updateAdminCategoryApi(editingCategory.id, payload, iconFile)
				const mappedUpdated = mapApiCategory(updated)
				setAllCategories((prev) =>
					prev.map((item) => (item.id === editingCategory.id ? mappedUpdated : item))
				)

				if (!currentKeyword) {
					setCategories((prev) =>
						prev.map((item) => (item.id === editingCategory.id ? mappedUpdated : item))
					)
				} else {
					setCategories((prev) => {
						const withoutOld = prev.filter((item) => item.id !== editingCategory.id)
						if (mappedUpdated.name.toLowerCase().includes(currentKeyword)) {
							return [mappedUpdated, ...withoutOld]
						}
						return withoutOld
					})
				}
				toast.success('Cập nhật danh mục thành công.')
			}

			closeFormModal()
		} catch (error: any) {
			const message =
				error?.response?.data?.message || error?.message || 'Không thể lưu danh mục. Vui lòng thử lại.'
			toast.error(message)
		} finally {
			setSubmitting(false)
		}
	}

	const openDeleteConfirm = (category: Category) => {
		setDeletingCategory(category)
	}

	const cancelDelete = () => {
		setDeletingCategory(null)
	}

	const confirmDelete = async () => {
		if (!deletingCategory) {
			return
		}

		setSubmitting(true)
		try {
			const updated = await updateAdminCategoryApi(
				deletingCategory.id,
				{
					name: deletingCategory.name,
					description: deletingCategory.description,
					isActive: false,
				},
				null
			)

			const mappedUpdated = mapApiCategory(updated)
			setAllCategories((prev) =>
				prev.map((item) => (item.id === deletingCategory.id ? mappedUpdated : item))
			)
			setCategories((prev) =>
				prev.map((item) => (item.id === deletingCategory.id ? mappedUpdated : item))
			)
			setDeletingCategory(null)
			toast.success('Vô hiệu hóa danh mục thành công.')
		} catch (error: any) {
			const message =
				error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái danh mục.'
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
						<h2 className="text-xl font-semibold text-secondary-900">Danh sách danh mục</h2>
						<p className="text-sm text-secondary-500 mt-1">
							Quản lý thông tin danh mục món ăn của cửa hàng.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={loadCategories} className="btn btn-outline btn-sm">
							<RefreshCw className="w-4 h-4" />
							Tải lại
						</button>

						<button type="button" onClick={openCreateModal} className="btn btn-primary btn-sm">
							<Plus className="w-4 h-4" />
							Thêm mới
						</button>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="rounded-xl border border-border p-3 bg-secondary-50">
						<p className="text-xs text-secondary-500">Tổng danh mục</p>
						<p className="text-2xl font-bold text-secondary-900">{allCategories.length}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-emerald-50">
						<p className="text-xs text-emerald-700">Đang hoạt động</p>
						<p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-amber-50">
						<p className="text-xs text-amber-700">Tạm ẩn</p>
						<p className="text-2xl font-bold text-amber-700">{inactiveCount}</p>
					</div>
				</div>
			</section>

			<section className="card p-5">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<h3 className="font-semibold text-secondary-900">Danh sách danh mục</h3>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm theo tên danh mục"
						className="input sm:w-72"
					/>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border text-secondary-500">
								<th className="text-left py-3 px-2 font-medium">ID</th>
								<th className="text-left py-3 px-2 font-medium">Tên danh mục</th>
								<th className="text-left py-3 px-2 font-medium hidden lg:table-cell">Mô tả</th>
								<th className="text-left py-3 px-2 font-medium">Trạng thái</th>
								<th className="text-left py-3 px-2 font-medium hidden md:table-cell">Cập nhật</th>
								<th className="text-left py-3 px-2 font-medium">Thao tác</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={6}>
										Đang tải dữ liệu danh mục...
									</td>
								</tr>
							) : categories.length === 0 ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={6}>
										Không có danh mục phù hợp.
									</td>
								</tr>
							) : (
								categories.map((category) => (
									<tr key={category.id} className="border-b border-border last:border-0 hover:bg-secondary-50">
										<td className="py-3 px-2 font-semibold text-secondary-700">#{category.id}</td>
										<td className="py-3 px-2 font-medium text-secondary-900">{category.name}</td>
										<td className="py-3 px-2 text-secondary-500 hidden lg:table-cell">{category.description}</td>
										<td className="py-3 px-2">
											<span
												className={cn(
													'badge',
													category.status === 'active'
														? 'bg-emerald-100 text-emerald-700'
														: 'bg-amber-100 text-amber-700'
												)}
											>
												{category.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
											</span>
										</td>
										<td className="py-3 px-2 text-secondary-500 hidden md:table-cell">{category.updatedAt}</td>
										<td className="py-3 px-2">
											<div className="flex justify-start gap-2">
												<button
													type="button"
													onClick={() => openEditModal(category)}
													className="btn btn-ghost btn-sm"
												>
													<Pencil className="w-4 h-4" />
													Sửa
												</button>
												<button
													type="button"
													onClick={() => openDeleteConfirm(category)}
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
			</section>

			{modalMode && (
				<div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl border border-border overflow-hidden w-full max-w-xl shadow-xl max-h-[85vh] flex flex-col">
						<div className="px-6 py-4 border-b border-border">
							<h3 className="text-lg font-semibold text-secondary-900">
								{modalMode === 'create' ? 'Thêm danh mục mới' : 'Sửa thông tin danh mục'}
							</h3>
							<p className="text-sm text-secondary-500 mt-1">
								{modalMode === 'create'
									? 'Nhập đầy đủ thông tin và nhấn Thêm để lưu vào CATEGORIES.'
									: 'Cập nhật thông tin và nhấn Sửa để lưu thay đổi.'}
							</p>
						</div>

						<div className="p-6 space-y-4 overflow-y-auto">
								<div>
									<label className="text-sm font-medium text-secondary-700">Icon danh mục *</label>
									<div className="mt-2 flex items-start gap-3">
										<div className="w-20 h-20 rounded-xl border border-dashed border-border bg-secondary-50 overflow-hidden flex items-center justify-center">
											{formValues.iconUrl ? (
												<img
													src={formValues.iconUrl}
													alt="Icon preview"
													className="w-full h-full object-cover"
												/>
											) : (
												<span className="text-xs text-secondary-400 px-2 text-center">Chưa có ảnh</span>
											)}
										</div>

										<div className="space-y-2">
											<label className="btn btn-outline btn-sm cursor-pointer">
												<ImagePlus className="w-4 h-4" />
												Tải ảnh lên
												<input
													type="file"
													accept="image/*"
													onChange={handleUploadIcon}
													className="hidden"
												/>
											</label>

											{formValues.iconUrl && (
												<button type="button" onClick={handleClearIcon} className="btn btn-ghost btn-sm">
													<X className="w-4 h-4" />
													Xóa ảnh
												</button>
											)}

											<p className="text-xs text-secondary-500">PNG/JPG, tối đa 2MB.</p>
										</div>
									</div>
									{formErrors.iconUrl && <p className="text-xs text-red-600 mt-1">{formErrors.iconUrl}</p>}
								</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">Tên danh mục *</label>
								<input
									value={formValues.name}
									onChange={(event) => onChangeField('name', event.target.value)}
									className={cn('input mt-1', formErrors.name && 'input-error')}
									placeholder="Ví dụ: Món ăn healthy"
								/>
								{formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">Mô tả *</label>
								<textarea
									value={formValues.description}
									onChange={(event) => onChangeField('description', event.target.value)}
									rows={3}
									className={cn('input mt-1 resize-none', formErrors.description && 'input-error')}
									placeholder="Mô tả ngắn cho danh mục"
								/>
								{formErrors.description && (
									<p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
								)}
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">Trạng thái</label>
								<div className="mt-2 flex gap-2">
									<button
										type="button"
										onClick={() => onChangeField('status', 'active')}
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
										onClick={() => onChangeField('status', 'inactive')}
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
						</div>

						<div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-white sticky bottom-0">
							<button type="button" onClick={closeFormModal} className="btn btn-outline btn-sm">
								Hủy bỏ
							</button>
							<button type="button" onClick={handleSubmitForm} className="btn btn-primary btn-sm" disabled={submitting}>
								{modalMode === 'create' ? 'Thêm' : 'Sửa'}
							</button>
						</div>
					</div>
				</div>
			)}

			{deletingCategory && (
				<div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
						<div className="flex items-start gap-3">
							<div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-secondary-900">Xác nhận chuyển trạng thái</h3>
								<p className="text-sm text-secondary-500 mt-1">
									Danh mục <strong>{deletingCategory.name}</strong> sẽ được chuyển sang trạng thái <strong>Tạm ẩn</strong>.
								</p>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<button type="button" onClick={cancelDelete} className="btn btn-outline btn-sm">
								Hủy bỏ
							</button>
							<button
								type="button"
								onClick={confirmDelete}
								className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
								disabled={submitting}
							>
								Đồng ý
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
