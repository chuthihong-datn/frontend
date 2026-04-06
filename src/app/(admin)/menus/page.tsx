'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	ImagePlus,
	Pencil,
	Plus,
	RefreshCw,
	Trash2,
	X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
	createAdminMenuApi,
	deleteAdminMenuApi,
	getAdminMenusApi,
	updateAdminMenuApi,
} from '@/api/adminMenu'
import { getAdminCategoriesApi } from '@/api/adminCategory'
import { getAdminToppingsApi } from '@/api/adminTopping'
import type {
	AdminCategoryResponse,
	AdminMenuResponse,
	AdminToppingResponse,
	AdminMenuRequest,
} from '@/types'

type MenuStatus = 'active' | 'inactive'

type Menu = {
	id: number
	name: string
	description: string
	basePrice: number
	amount: number
	status: MenuStatus
	outOfStock: boolean
	deleted: boolean
	images: string[]
	categoryName: string
	toppings: string[]
	sizes: MenuSize[]
}

type CategoryOption = {
	id: number
	name: string
	status: MenuStatus
}

type ToppingOption = {
	id: number
	name: string
	price: number
	status: MenuStatus
	outOfStock: boolean
}

type MenuSize = {
	sizeName: string
	extraPrice: number
}

type MenuSizeForm = {
	sizeName: string
	extraPrice: string
}

type MenuFormValues = {
	categoryId: string
	name: string
	description: string
	basePrice: string
	amount: string
	status: MenuStatus
	toppingIds: number[]
	sizes: MenuSizeForm[]
}

type MenuFormErrors = {
	categoryId?: string
	name?: string
	description?: string
	basePrice?: string
	amount?: string
	sizes?: Array<{
		sizeName?: string
		extraPrice?: string
	}>
}

type ModalMode = 'create' | 'edit' | null

const EMPTY_SIZE: MenuSizeForm = {
	sizeName: '',
	extraPrice: '',
}

const EMPTY_FORM: MenuFormValues = {
	categoryId: '',
	name: '',
	description: '',
	basePrice: '',
	amount: '1',
	status: 'active',
	toppingIds: [],
	sizes: [EMPTY_SIZE],
}

function formatPrice(value: number): string {
	return `${Number(value || 0).toLocaleString('vi-VN')} đ`
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

async function readFilesAsDataUrls(files: File[]): Promise<string[]> {
	return Promise.all(files.map(readFileAsDataUrl))
}

function isBlankSizeRow(row: MenuSizeForm): boolean {
	return !row.sizeName.trim() && !row.extraPrice.trim()
}

function mapApiMenu(item: AdminMenuResponse): Menu {
	return {
		id: Number(item.menuId),
		name: item.name,
		description: item.description ?? '',
		basePrice: Number(item.basePrice),
		amount: Number(item.amount),
		status: item.isActive ? 'active' : 'inactive',
		outOfStock: item.outOfStock ?? false,
		deleted: item.deleted ?? false,
		images: item.images ?? [],
		categoryName: item.categoryName ?? '',
		toppings: item.toppings ?? [],
		sizes: (item.sizes ?? []).map((size) => ({
			sizeName: size.sizeName,
			extraPrice: Number(size.extraPrice),
		})),
	}
}

function mapCategoryOption(item: AdminCategoryResponse): CategoryOption {
	return {
		id: Number(item.categoryId),
		name: item.name,
		status: item.isActive ? 'active' : 'inactive',
	}
}

function mapToppingOption(item: AdminToppingResponse): ToppingOption {
	return {
		id: Number(item.toppingId),
		name: item.name,
		price: Number(item.price),
		status: item.isActive ? 'active' : 'inactive',
		outOfStock: Boolean(item.outOfStock),
	}
}

function getDefaultCategoryId(categories: CategoryOption[]): string {
	return (
		categories.find((item) => item.status === 'active')?.id.toString() ??
		categories[0]?.id.toString() ??
		''
	)
}

function findCategoryIdByName(name: string, categories: CategoryOption[]): string {
	return categories.find((item) => item.name === name)?.id.toString() ?? ''
}

function findToppingIdsByNames(names: string[], toppings: ToppingOption[]): number[] {
	const nameSet = new Set(names)
	return toppings.filter((item) => nameSet.has(item.name)).map((item) => item.id)
}

function validateForm(values: MenuFormValues): MenuFormErrors {
	const errors: MenuFormErrors = {}

	if (!values.categoryId.trim()) {
		errors.categoryId = 'Vui lòng chọn danh mục.'
	}

	if (!values.name.trim()) {
		errors.name = 'Tên món ăn là bắt buộc.'
	}

	if (!values.basePrice.trim()) {
		errors.basePrice = 'Giá gốc là bắt buộc.'
	} else {
		const parsed = Number(values.basePrice)
		if (Number.isNaN(parsed) || parsed < 0) {
			errors.basePrice = 'Giá gốc phải là số lớn hơn hoặc bằng 0.'
		}
	}

	if (!values.amount.trim()) {
		errors.amount = 'Số lượng là bắt buộc.'
	} else {
		const parsed = Number(values.amount)
		if (Number.isNaN(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
			errors.amount = 'Số lượng phải là số nguyên không âm.'
		}
	}

	const sizeErrors: Array<{ sizeName?: string; extraPrice?: string }> = []
	values.sizes.forEach((size, index) => {
		if (isBlankSizeRow(size)) {
			return
		}

		const rowErrors: { sizeName?: string; extraPrice?: string } = {}

		if (!size.sizeName.trim()) {
			rowErrors.sizeName = 'Tên size là bắt buộc.'
		}

		if (!size.extraPrice.trim()) {
			rowErrors.extraPrice = 'Giá thêm là bắt buộc.'
		} else {
			const parsed = Number(size.extraPrice)
			if (Number.isNaN(parsed) || parsed < 0) {
				rowErrors.extraPrice = 'Giá thêm phải là số lớn hơn hoặc bằng 0.'
			}
		}

		if (Object.keys(rowErrors).length > 0) {
			sizeErrors[index] = rowErrors
		}
	})

	if (sizeErrors.length > 0) {
		errors.sizes = sizeErrors
	}

	return errors
}

function buildPayload(values: MenuFormValues): AdminMenuRequest {
	return {
		categoryId: Number(values.categoryId),
		name: values.name.trim(),
		description: values.description.trim(),
		basePrice: Number(values.basePrice),
		amount: Number(values.amount),
		toppingIds: values.toppingIds,
		sizes: values.sizes
			.filter((size) => !isBlankSizeRow(size))
			.map((size) => ({
				sizeName: size.sizeName.trim(),
				extraPrice: Number(size.extraPrice),
			})),
	}
}

export default function AdminMenusPage() {
	const [allMenus, setAllMenus] = useState<Menu[]>([])
	const [categories, setCategories] = useState<CategoryOption[]>([])
	const [toppings, setToppings] = useState<ToppingOption[]>([])
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [query, setQuery] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [modalMode, setModalMode] = useState<ModalMode>(null)
	const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
	const [deletingMenu, setDeletingMenu] = useState<Menu | null>(null)
	const [formValues, setFormValues] = useState<MenuFormValues>(EMPTY_FORM)
	const [formErrors, setFormErrors] = useState<MenuFormErrors>({})
	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const [imagePreviews, setImagePreviews] = useState<string[]>([])
	const [existingImageCount, setExistingImageCount] = useState(0)

	const visibleMenus = useMemo(
		() => allMenus.filter((item) => !item.deleted),
		[allMenus]
	)

	const activeCount = useMemo(
		() => visibleMenus.filter((item) => item.status === 'active').length,
		[visibleMenus]
	)
	const inactiveCount = visibleMenus.length - activeCount
	const outOfStockCount = useMemo(
		() => visibleMenus.filter((item) => item.outOfStock).length,
		[visibleMenus]
	)

	const filteredMenus = useMemo(() => {
		const keyword = query.trim().toLowerCase()
		if (!keyword) {
			return visibleMenus
		}

		return visibleMenus.filter((menu) => {
			const text = [
				menu.name,
				menu.description,
				menu.categoryName,
				...menu.toppings,
				...menu.sizes.map((size) => size.sizeName),
			].join(' ')

			return text.toLowerCase().includes(keyword)
		})
	}, [visibleMenus, query])

	const itemsPerPage = 10
	const totalPages = Math.max(1, Math.ceil(filteredMenus.length / itemsPerPage))
	const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)
	const paginatedMenus = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		return filteredMenus.slice(startIndex, startIndex + itemsPerPage)
	}, [filteredMenus, currentPage])

	const loadInitialData = async () => {
		setLoading(true)
		try {
			const [menusResult, categoriesResult, toppingsResult] = await Promise.allSettled([
				getAdminMenusApi(),
				getAdminCategoriesApi(),
				getAdminToppingsApi(),
			])

			if (menusResult.status === 'fulfilled') {
				setAllMenus(menusResult.value.map(mapApiMenu))
			} else {
				toast.error('Không thể tải danh sách món ăn.')
			}

			if (categoriesResult.status === 'fulfilled') {
				setCategories(categoriesResult.value.map(mapCategoryOption))
			} else {
				toast.error('Không thể tải danh sách danh mục.')
			}

			if (toppingsResult.status === 'fulfilled') {
				setToppings(toppingsResult.value.map(mapToppingOption))
			} else {
				toast.error('Không thể tải danh sách topping.')
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể tải dữ liệu trang món ăn.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadInitialData()
	}, [])

	useEffect(() => {
		setCurrentPage(1)
	}, [query])

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const closeFormModal = () => {
		setModalMode(null)
		setEditingMenu(null)
		setFormErrors({})
		setSelectedFiles([])
		setImagePreviews([])
		setExistingImageCount(0)
	}

	const openCreateModal = () => {
		setFormValues({
			...EMPTY_FORM,
			categoryId: getDefaultCategoryId(categories),
		})
		setFormErrors({})
		setEditingMenu(null)
		setSelectedFiles([])
		setImagePreviews([])
		setExistingImageCount(0)
		setModalMode('create')
	}

	const openEditModal = (menu: Menu) => {
		setFormValues({
			categoryId: findCategoryIdByName(menu.categoryName, categories),
			name: menu.name,
			description: menu.description,
			basePrice: String(menu.basePrice),
			amount: String(menu.amount),
			status: menu.status,
			toppingIds: findToppingIdsByNames(menu.toppings, toppings),
			sizes:
				menu.sizes.length > 0
					? menu.sizes.map((size) => ({
						sizeName: size.sizeName,
						extraPrice: String(size.extraPrice),
					}))
					: [EMPTY_SIZE],
		})
		setFormErrors({})
		setEditingMenu(menu)
		setSelectedFiles([])
		setImagePreviews(menu.images)
		setExistingImageCount(menu.images.length)
		setModalMode('edit')
	}

	const handleFieldChange = (
		field: 'categoryId' | 'name' | 'description' | 'basePrice' | 'amount',
		value: string
	) => {
		setFormValues((prev) => ({ ...prev, [field]: value }))
		if (formErrors[field]) {
			setFormErrors((prev) => ({ ...prev, [field]: undefined }))
		}
	}

	const handleSizeChange = (
		index: number,
		field: keyof MenuSizeForm,
		value: string
	) => {
		setFormValues((prev) => ({
			...prev,
			sizes: prev.sizes.map((size, sizeIndex) =>
				sizeIndex === index ? { ...size, [field]: value } : size
			),
		}))

		setFormErrors((prev) => {
			if (!prev.sizes?.[index]?.[field]) {
				return prev
			}

			return {
				...prev,
				sizes: prev.sizes?.map((sizeError, sizeIndex) =>
					sizeIndex === index ? { ...sizeError, [field]: undefined } : sizeError
				),
			}
		})
	}

	const addSizeRow = () => {
		setFormValues((prev) => ({ ...prev, sizes: [...prev.sizes, { ...EMPTY_SIZE }] }))
	}

	const removeSizeRow = (index: number) => {
		setFormValues((prev) => {
			const nextSizes = prev.sizes.filter((_, sizeIndex) => sizeIndex !== index)
			return {
				...prev,
				sizes: nextSizes.length > 0 ? nextSizes : [{ ...EMPTY_SIZE }],
			}
		})

		setFormErrors((prev) => ({
			...prev,
			sizes: prev.sizes?.filter((_, sizeIndex) => sizeIndex !== index),
		}))
	}

	const handleToggleTopping = (toppingId: number) => {
		setFormValues((prev) => ({
			...prev,
			toppingIds: prev.toppingIds.includes(toppingId)
				? prev.toppingIds.filter((id) => id !== toppingId)
				: [...prev.toppingIds, toppingId],
		}))
	}

	const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? [])
		if (files.length === 0) {
			return
		}

		const invalidFile = files.find((file) => !file.type.startsWith('image/'))
		if (invalidFile) {
			toast.error('Vui lòng chọn đúng tệp hình ảnh.')
			event.target.value = ''
			return
		}

		const oversizedFile = files.find((file) => file.size > 2 * 1024 * 1024)
		if (oversizedFile) {
			toast.error('Mỗi ảnh phải nhỏ hơn 2MB.')
			event.target.value = ''
			return
		}

		try {
			const previews = await readFilesAsDataUrls(files)
			setSelectedFiles((prev) => [...prev, ...files])
			setImagePreviews((prev) => [...prev, ...previews])
		} catch {
			toast.error('Không thể tải ảnh. Vui lòng thử lại.')
		} finally {
			event.target.value = ''
		}
	}

	const removeSelectedImage = (index: number) => {
		if (index < existingImageCount) {
			return
		}

		const selectedFileIndex = index - existingImageCount
		setImagePreviews((prev) => prev.filter((_, imageIndex) => imageIndex !== index))
		setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== selectedFileIndex))
	}

	const handleSubmit = async () => {
		const errors = validateForm(formValues)
		setFormErrors(errors)

		if (Object.keys(errors).length > 0) {
			toast.error('Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.')
			return
		}

		setSubmitting(true)
		try {
			const payload = buildPayload(formValues)

			if (modalMode === 'create') {
				const created = await createAdminMenuApi(payload, selectedFiles)
				if (!created.deleted) {
					const mappedCreated = mapApiMenu(created)
					setAllMenus((prev) => [mappedCreated, ...prev])
				}
				toast.success('Thêm món ăn thành công.')
				closeFormModal()
				return
			}

			if (modalMode === 'edit' && editingMenu) {
				const updated = await updateAdminMenuApi(editingMenu.id, payload, selectedFiles)
				if (updated.deleted) {
					setAllMenus((prev) => prev.filter((item) => item.id !== editingMenu.id))
				} else {
					const mappedUpdated = mapApiMenu(updated)
					setAllMenus((prev) => prev.map((item) => (item.id === editingMenu.id ? mappedUpdated : item)))
				}
				toast.success('Cập nhật món ăn thành công.')
				closeFormModal()
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể lưu món ăn')
		} finally {
			setSubmitting(false)
		}
	}

	const openDeleteConfirm = (menu: Menu) => {
		setDeletingMenu(menu)
	}

	const cancelDelete = () => {
		setDeletingMenu(null)
	}

	const confirmDelete = async () => {
		if (!deletingMenu) {
			return
		}

		setSubmitting(true)
		try {
			await deleteAdminMenuApi(deletingMenu.id)
			setAllMenus((prev) => prev.filter((item) => item.id !== deletingMenu.id))
			setDeletingMenu(null)
			toast.success('Xóa món ăn thành công.')
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái món ăn')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="space-y-6">
			<section className="card p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-secondary-900">Danh sách món ăn</h2>
						<p className="text-sm text-secondary-500 mt-1">
							Quản lý món ăn, size, topping và trạng thái hiển thị của menu.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={loadInitialData} className="btn btn-outline btn-sm">
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
						<p className="text-xs text-secondary-500">Tổng món ăn</p>
						<p className="text-2xl font-bold text-secondary-900">{visibleMenus.length}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-emerald-50">
						<p className="text-xs text-emerald-700">Đang hoạt động</p>
						<p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-amber-50">
						<p className="text-xs text-amber-700">Tạm ẩn</p>
						<p className="text-2xl font-bold text-amber-700">{inactiveCount}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-blue-50">
						<p className="text-xs text-blue-700">Hết hàng</p>
						<p className="text-2xl font-bold text-blue-700">{outOfStockCount}</p>
					</div>
				</div>
			</section>

			<section className="card p-5">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<h3 className="font-semibold text-secondary-900">Danh sách món ăn</h3>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm theo tên, danh mục hoặc topping"
						className="input sm:w-80"
					/>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm min-w-[900px]">
						<thead>
							<tr className="border-b border-border text-secondary-500">
								<th className="text-left py-3 px-2 font-medium">ID</th>
								<th className="text-left py-3 px-2 font-medium">Ảnh</th>
								<th className="text-left py-3 px-2 font-medium">Tên món</th>
								<th className="text-left py-3 px-2 font-medium">Danh mục</th>
								<th className="text-left py-3 px-2 font-medium">Giá gốc</th>
								<th className="text-left py-3 px-2 font-medium">Số lượng</th>
								<th className="text-left py-3 px-2 font-medium">Trạng thái</th>
								<th className="text-left py-3 px-2 font-medium">Thao tác</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={8}>
										Đang tải dữ liệu món ăn...
									</td>
								</tr>
							) : filteredMenus.length === 0 ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={8}>
										Không có món ăn phù hợp.
									</td>
								</tr>
							) : (
								paginatedMenus.map((menu) => {
									const firstImage = menu.images[0]

									return (
										<tr key={menu.id} className="border-b border-border last:border-0 hover:bg-secondary-50">
											<td className="py-3 px-2 font-semibold text-secondary-700">#{menu.id}</td>
											<td className="py-3 px-2">
												<div className="w-14 h-14 rounded-xl border border-border bg-secondary-100 overflow-hidden flex items-center justify-center">
													{firstImage ? (
														<img src={firstImage} alt={menu.name} className="w-full h-full object-cover" />
													) : (
														<ImagePlus className="w-5 h-5 text-secondary-400" />
													)}
												</div>
											</td>
											<td className="py-3 px-2 max-w-[150px]">
												<div className="font-medium text-secondary-900 line-clamp-1">{menu.name}</div>
											</td>
											<td className="py-3 px-2 text-secondary-700">{menu.categoryName}</td>
											<td className="py-3 px-2 text-secondary-700">{formatPrice(menu.basePrice)}</td>
											<td className="py-3 px-2 text-secondary-700">{menu.amount}</td>
											<td className="py-3 px-2">
												<span
													className={cn(
														'badge',
														menu.status === 'active'
															? 'bg-emerald-100 text-emerald-700'
															: 'bg-amber-100 text-amber-700'
													)}
												>
													{menu.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
												</span>
											</td>
											<td className="py-3 px-2">
												<div className="flex flex-wrap gap-2">
													<button type="button" onClick={() => openEditModal(menu)} className="btn btn-ghost btn-sm">
														<Pencil className="w-4 h-4" />
														Sửa
													</button>

													<button
														type="button"
														onClick={() => openDeleteConfirm(menu)}
														className="btn btn-sm bg-red-50 text-red-700 hover:bg-red-100"
													>
														<Trash2 className="w-4 h-4" />
														Xóa
													</button>
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{filteredMenus.length > 0 && (
					<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-secondary-500">
							Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
							{Math.min(currentPage * itemsPerPage, filteredMenus.length)} / {filteredMenus.length} món ăn
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
					Món ăn bị tạm ẩn sẽ không bị xóa khỏi hệ thống, chỉ ngừng hiển thị cho khách hàng.
				</p>
			</section>

			{modalMode && (
				<div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl border border-border overflow-hidden w-full max-w-5xl shadow-xl max-h-[90vh] flex flex-col">
						<div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
							<div>
								<h3 className="text-lg font-semibold text-secondary-900">
									{modalMode === 'create' ? 'Thêm món ăn mới' : 'Sửa thông tin món ăn'}
								</h3>
								<p className="text-sm text-secondary-500 mt-1">
									{modalMode === 'create'
										? 'Nhập thông tin món ăn, size, topping và ảnh hiển thị.'
										: 'Cập nhật nội dung, size hoặc topping cho món ăn.'}
								</p>
							</div>
							<button type="button" onClick={closeFormModal} className="btn btn-ghost btn-sm">
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="p-6 space-y-6 overflow-y-auto">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
								<div>
									<label className="text-sm font-medium text-secondary-700">
										Danh mục <span className="text-red-600">*</span>
									</label>
									<select
										value={formValues.categoryId}
										onChange={(event) => handleFieldChange('categoryId', event.target.value)}
										className={cn('input mt-1', formErrors.categoryId && 'input-error')}
									>
										<option value="">Chọn danh mục</option>
										{categories.map((category) => (
											<option key={category.id} value={category.id}>
												{category.name}
												{category.status === 'inactive' ? ' (Tạm ẩn)' : ''}
											</option>
										))}
									</select>
									{formErrors.categoryId && (
										<p className="text-xs text-red-600 mt-1">{formErrors.categoryId}</p>
									)}
								</div>

								<div>
									<label className="text-sm font-medium text-secondary-700">
										Tên món ăn <span className="text-red-600">*</span>
									</label>
									<input
										value={formValues.name}
										onChange={(event) => handleFieldChange('name', event.target.value)}
										className={cn('input mt-1', formErrors.name && 'input-error')}
										placeholder="Ví dụ: Cơm gà sốt cay"
									/>
									{formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
								</div>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-secondary-700">
										Giá gốc (đ) <span className="text-red-600">*</span>
									</label>
									<input
										type="number"
										min={0}
										value={formValues.basePrice}
										onChange={(event) => handleFieldChange('basePrice', event.target.value)}
										className={cn('input mt-1', formErrors.basePrice && 'input-error')}
										placeholder="45000"
									/>
									{formErrors.basePrice && (
										<p className="text-xs text-red-600 mt-1">{formErrors.basePrice}</p>
									)}
								</div>

								<div>
									<label className="text-sm font-medium text-secondary-700">
										Số lượng <span className="text-red-600">*</span>
									</label>
									<input
										type="number"
										min={0}
										value={formValues.amount}
										onChange={(event) => handleFieldChange('amount', event.target.value)}
										className={cn('input mt-1', formErrors.amount && 'input-error')}
										placeholder="1"
									/>
									{formErrors.amount && <p className="text-xs text-red-600 mt-1">{formErrors.amount}</p>}
								</div>
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">Mô tả món ăn</label>
								<textarea
									value={formValues.description}
									onChange={(event) => handleFieldChange('description', event.target.value)}
									className={cn('input mt-1 min-h-28', formErrors.description && 'input-error')}
									placeholder="Mô tả chi tiết món ăn"
								/>
								{formErrors.description && (
									<p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
								)}
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">Ảnh món ăn</label>
								<div className="mt-1 border border-dashed border-border rounded-2xl p-4 bg-secondary-50">
									<div className="flex items-center gap-3">
										<label className="btn btn-outline btn-sm cursor-pointer">
											<ImagePlus className="w-4 h-4" />
											Thêm ảnh
											<input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
										</label>
									</div>

									{imagePreviews.length > 0 ? (
										<div className="mt-3 flex flex-wrap gap-2">
											{imagePreviews.map((src, index) => (
												<div
													key={`${src}-${index}`}
													className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-white"
												>
													<img src={src} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" />
													{index >= existingImageCount && (
														<button
															type="button"
															onClick={() => removeSelectedImage(index)}
															className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/80"
															aria-label={`Xóa ảnh ${index + 1}`}
														>
															<X className="w-3.5 h-3.5" />
														</button>
													)}
												</div>
											))}
										</div>
									) : (
										<p className="mt-3 text-xs text-secondary-400">Chưa có ảnh được chọn.</p>
									)}
									<p className="mt-2 text-xs text-secondary-500">Ảnh mới sẽ được thêm vào cuối danh sách.</p>
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between gap-3">
									<div>
										<h4 className="text-sm font-semibold text-secondary-900">Size món ăn</h4>
										<p className="text-xs text-secondary-500 mt-1">Nhập size và giá thêm tương ứng cho từng size.</p>
									</div>
									<button type="button" onClick={addSizeRow} className="btn btn-outline btn-sm">
										<Plus className="w-4 h-4" />
										Thêm size
									</button>
								</div>

								<div className="mt-3 space-y-3">
									{formValues.sizes.map((size, index) => (
										<div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 items-start">
											<div>
												<input
													value={size.sizeName}
													onChange={(event) => handleSizeChange(index, 'sizeName', event.target.value)}
													className={cn('input', formErrors.sizes?.[index]?.sizeName && 'input-error')}
													placeholder="Ví dụ: Size M"
												/>
												{formErrors.sizes?.[index]?.sizeName && (
													<p className="text-xs text-red-600 mt-1">{formErrors.sizes?.[index]?.sizeName}</p>
												)}
											</div>

											<div>
												<input
													type="number"
													min={0}
													value={size.extraPrice}
													onChange={(event) => handleSizeChange(index, 'extraPrice', event.target.value)}
													className={cn('input', formErrors.sizes?.[index]?.extraPrice && 'input-error')}
													placeholder="0"
												/>
												{formErrors.sizes?.[index]?.extraPrice && (
													<p className="text-xs text-red-600 mt-1">{formErrors.sizes?.[index]?.extraPrice}</p>
												)}
											</div>

											<button
												type="button"
												onClick={() => removeSizeRow(index)}
												className="btn btn-sm bg-red-50 text-red-700 hover:bg-red-100 md:mt-0 mt-1"
											>
												<X className="w-4 h-4" />
											</button>
										</div>
									))}
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between gap-3">
									<div>
										<h4 className="text-sm font-semibold text-secondary-900">Topping cho món ăn</h4>
										<p className="text-xs text-secondary-500 mt-1">Chọn topping từ danh sách topping đang có.</p>
									</div>
									<p className="text-xs text-secondary-500">Đã chọn {formValues.toppingIds.length} topping</p>
								</div>

								{toppings.length === 0 ? (
									<p className="mt-3 text-sm text-secondary-500">Chưa có topping để chọn.</p>
								) : (
									<div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
										{toppings.map((topping) => {
											const isChecked = formValues.toppingIds.includes(topping.id)
											return (
												<label
													key={topping.id}
													className={cn(
														'flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
														isChecked
															? 'border-primary bg-primary/5'
															: 'border-border hover:bg-secondary-50'
													)}
												>
													<div className="flex items-center gap-3 min-w-0">
														<input
															type="checkbox"
															checked={isChecked}
															onChange={() => handleToggleTopping(topping.id)}
															className="w-4 h-4 accent-primary shrink-0"
														/>
														<div className="min-w-0">
															<p className="font-medium text-secondary-900 truncate">{topping.name}</p>
															<p className="text-xs text-secondary-500">+{formatPrice(topping.price)}</p>
														</div>
													</div>
												</label>
											)
										})}
									</div>
								)}
							</div>
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

			{deletingMenu && (
				<div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
						<div className="flex items-start gap-3">
							<div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-secondary-900">Xác nhận xóa món ăn</h3>
								<p className="text-sm text-secondary-500 mt-1">
									Món ăn <strong>{deletingMenu.name}</strong> sẽ được xóa ra khỏi hệ thống.
								</p>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<button type="button" onClick={cancelDelete} className="btn btn-outline btn-sm">
								Hủy bỏ
							</button>
							<button type="button" onClick={confirmDelete} disabled={submitting} className="btn btn-sm bg-red-600 text-white hover:bg-red-700">
								Xác nhận
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
