'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, ImagePlus, Pencil, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { disableAdminAccountApi, getAdminAccountsApi, updateAdminAccountApi } from '@/api/adminAccount'
import type { AdminAccountRequest, AdminAccountResponse } from '@/types'

type AccountStatus = 'active' | 'inactive'

type Account = {
	id: number | string
	fullName: string
	email: string
	phone: string
	role: string
	status: AccountStatus
	avtUrl: string
	updatedAt: string
}

type FormValues = {
	fullName: string
	role: string
	avtUrl: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const EMPTY_FORM: FormValues = {
	fullName: '',
	role: 'CUSTOMER',
	avtUrl: '',
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

function mapApiAccount(item: AdminAccountResponse): Account {
	return {
		id: item.accountId,
		fullName: item.fullName,
		email: item.email,
		phone: item.phone ?? '--',
		role: item.role,
		status: item.isActive ? 'active' : 'inactive',
		avtUrl: item.avtUrl ?? '',
		updatedAt: formatApiDateTime(item.updatedAt),
	}
}

function validateForm(values: FormValues): FormErrors {
	const errors: FormErrors = {}

	if (!values.fullName.trim()) {
		errors.fullName = 'Họ tên là bắt buộc.'
	}

	if (!values.role.trim()) {
		errors.role = 'Vai trò là bắt buộc.'
	}

	return errors
}

function normalizeRole(role: string): string {
	return role?.toUpperCase?.() || 'CUSTOMER'
}

function roleLabel(role: string): string {
	const normalized = normalizeRole(role)
	if (normalized === 'ADMIN') {
		return 'Quản trị viên'
	}
	if (normalized === 'CUSTOMER') {
		return 'Khách hàng'
	}
	return normalized
}

export default function AdminAccountsPage() {
	const [allAccounts, setAllAccounts] = useState<Account[]>([])
	const [accounts, setAccounts] = useState<Account[]>([])
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [query, setQuery] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const hasMountedSearch = useRef(false)

	const [editingAccount, setEditingAccount] = useState<Account | null>(null)
	const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
	const [avatarFile, setAvatarFile] = useState<File | null>(null)
	const [avatarPreview, setAvatarPreview] = useState('')
	const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM)
	const [formErrors, setFormErrors] = useState<FormErrors>({})

	const activeCount = useMemo(
		() => allAccounts.filter((item) => item.status === 'active').length,
		[allAccounts]
	)
	const inactiveCount = allAccounts.length - activeCount
	const itemsPerPage = 10
	const totalPages = Math.max(1, Math.ceil(accounts.length / itemsPerPage))
	const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)
	const paginatedAccounts = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		return accounts.slice(startIndex, startIndex + itemsPerPage)
	}, [accounts, currentPage])

	const availableRoles = useMemo(() => {
		const roles = new Set<string>(['ADMIN', 'CUSTOMER'])
		allAccounts.forEach((item) => {
			if (item.role) {
				roles.add(normalizeRole(item.role))
			}
		})
		if (formValues.role) {
			roles.add(normalizeRole(formValues.role))
		}
		return Array.from(roles)
	}, [allAccounts, formValues.role])

	const loadAccounts = async () => {
		setLoading(true)
		try {
			const response = await getAdminAccountsApi()
			const mapped = response.map(mapApiAccount)
			setAllAccounts(mapped)
			setAccounts(mapped)
		} catch (error: any) {
			const message =
				error?.response?.data?.message || error?.message || 'Không thể tải danh sách tài khoản.'
			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadAccounts()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		if (!hasMountedSearch.current) {
			hasMountedSearch.current = true
			return
		}

		const timeoutId = setTimeout(() => {
			const keyword = query.trim().toLowerCase()
			if (!keyword) {
				setAccounts(allAccounts)
				return
			}

			setAccounts(
				allAccounts.filter(
					(item) =>
						item.fullName.toLowerCase().includes(keyword) ||
						item.email.toLowerCase().includes(keyword) ||
						item.phone.toLowerCase().includes(keyword)
				)
			)
		}, 350)

		return () => clearTimeout(timeoutId)
	}, [query, allAccounts])

	useEffect(() => {
		setCurrentPage(1)
	}, [query])

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const openEditModal = (account: Account) => {
		setEditingAccount(account)
		setFormValues({
			fullName: account.fullName,
			role: normalizeRole(account.role),
			avtUrl: account.avtUrl,
		})
		setAvatarFile(null)
		setAvatarPreview(account.avtUrl)
		setFormErrors({})
	}

	const closeEditModal = () => {
		setEditingAccount(null)
		setAvatarFile(null)
		setAvatarPreview('')
		setFormErrors({})
		setFormValues(EMPTY_FORM)
	}

	const onChangeField = (field: keyof FormValues, value: string) => {
		setFormValues((prev) => ({ ...prev, [field]: value }))
		if (formErrors[field]) {
			setFormErrors((prev) => ({ ...prev, [field]: undefined }))
		}
	}

	const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
			toast.error('Ảnh đại diện phải nhỏ hơn 2MB.')
			event.target.value = ''
			return
		}

		try {
			const dataUrl = await readFileAsDataUrl(file)
			setAvatarFile(file)
			setAvatarPreview(dataUrl)
		} catch {
			toast.error('Không thể tải ảnh. Vui lòng thử lại.')
		} finally {
			event.target.value = ''
		}
	}

	const handleRemoveSelectedAvatar = () => {
		setAvatarFile(null)
		setAvatarPreview(formValues.avtUrl)
	}

	const handleSubmitEdit = async () => {
		if (!editingAccount) {
			return
		}

		const errors = validateForm(formValues)
		setFormErrors(errors)
		if (Object.keys(errors).length > 0) {
			toast.error('Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.')
			return
		}

		setSubmitting(true)
		try {
			const payload: AdminAccountRequest = {
				fullName: formValues.fullName.trim(),
				role: normalizeRole(formValues.role),
				avtUrl: formValues.avtUrl.trim(),
			}

			const updated = await updateAdminAccountApi(editingAccount.id, payload, avatarFile)
			const mappedUpdated = mapApiAccount(updated)

			setAllAccounts((prev) =>
				prev.map((item) => (item.id === editingAccount.id ? mappedUpdated : item))
			)
			setAccounts((prev) =>
				prev.map((item) => (item.id === editingAccount.id ? mappedUpdated : item))
			)

			toast.success('Cập nhật tài khoản thành công.')
			closeEditModal()
		} catch (error: any) {
			const message =
				error?.response?.data?.message || error?.message || 'Không thể cập nhật tài khoản.'
			toast.error(message)
		} finally {
			setSubmitting(false)
		}
	}

	const openDeleteConfirm = (account: Account) => {
		setDeletingAccount(account)
	}

	const cancelDelete = () => {
		setDeletingAccount(null)
	}

	const confirmDisable = async () => {
		if (!deletingAccount) {
			return
		}

		if (deletingAccount.status === 'inactive') {
			toast.info('Tài khoản này đã ở trạng thái vô hiệu hóa.')
			setDeletingAccount(null)
			return
		}

		setSubmitting(true)
		try {
			await disableAdminAccountApi(deletingAccount.id)
			await loadAccounts()
			setDeletingAccount(null)
			toast.success('Vô hiệu hóa tài khoản thành công.')
		} catch (error: any) {
			const message =
				error?.response?.data?.message || error?.message || 'Không thể vô hiệu hóa tài khoản.'
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
						<h2 className="text-xl font-semibold text-secondary-900">Danh sách tài khoản</h2>
						<p className="text-sm text-secondary-500 mt-1">
							Quản lý thông tin tài khoản người dùng trong hệ thống.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={loadAccounts} className="btn btn-outline btn-sm">
							<RefreshCw className="w-4 h-4" />
							Tải lại
						</button>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="rounded-xl border border-border p-3 bg-secondary-50">
						<p className="text-xs text-secondary-500">Tổng tài khoản</p>
						<p className="text-2xl font-bold text-secondary-900">{allAccounts.length}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-emerald-50">
						<p className="text-xs text-emerald-700">Đang hoạt động</p>
						<p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-amber-50">
						<p className="text-xs text-amber-700">Vô hiệu hóa</p>
						<p className="text-2xl font-bold text-amber-700">{inactiveCount}</p>
					</div>
				</div>
			</section>

			<section className="card p-5">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<h3 className="font-semibold text-secondary-900">Danh sách tài khoản</h3>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm theo họ tên, email, số điện thoại"
						className="input sm:w-80"
					/>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border text-secondary-500">
								<th className="text-left py-3 px-2 font-medium">ID</th>
								<th className="text-left py-3 px-2 font-medium">Họ tên</th>
								<th className="text-left py-3 px-2 font-medium hidden lg:table-cell">Email</th>
								<th className="text-left py-3 px-2 font-medium hidden md:table-cell">Vai trò</th>
								<th className="text-left py-3 px-2 font-medium">Trạng thái</th>
								<th className="text-left py-3 px-2 font-medium hidden xl:table-cell">Cập nhật</th>
								<th className="text-left py-3 px-2 font-medium">Thao tác</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={7}>
										Đang tải dữ liệu tài khoản...
									</td>
								</tr>
							) : accounts.length === 0 ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={7}>
										Không có tài khoản phù hợp.
									</td>
								</tr>
							) : (
								paginatedAccounts.map((account) => (
									<tr key={account.id} className="border-b border-border last:border-0 hover:bg-secondary-50">
										<td className="py-3 px-2 font-semibold text-secondary-700">#{account.id}</td>
										<td className="py-3 px-2 font-medium text-secondary-900">{account.fullName}</td>
										<td className="py-3 px-2 text-secondary-500 hidden lg:table-cell">{account.email}</td>
										<td className="py-3 px-2 hidden md:table-cell">{roleLabel(account.role)}</td>
										<td className="py-3 px-2">
											<span
												className={cn(
													'badge',
													account.status === 'active'
														? 'bg-emerald-100 text-emerald-700'
														: 'bg-amber-100 text-amber-700'
												)}
											>
												{account.status === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
											</span>
										</td>
										<td className="py-3 px-2 text-secondary-500 hidden xl:table-cell">{account.updatedAt}</td>
										<td className="py-3 px-2">
											<div className="flex justify-start gap-2">
												<button
													type="button"
													onClick={() => openEditModal(account)}
													className="btn btn-ghost btn-sm"
												>
													<Pencil className="w-4 h-4" />
													Sửa
												</button>
												<button
													type="button"
													onClick={() => openDeleteConfirm(account)}
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

				{accounts.length > 0 && (
					<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-secondary-500">
							Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
							{Math.min(currentPage * itemsPerPage, accounts.length)} / {accounts.length} tài khoản
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
			</section>

			{editingAccount && (
				<div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl border border-border overflow-hidden w-full max-w-xl shadow-xl max-h-[85vh] flex flex-col">
						<div className="px-6 py-4 border-b border-border">
							<h3 className="text-lg font-semibold text-secondary-900">Sửa thông tin tài khoản</h3>
							<p className="text-sm text-secondary-500 mt-1">
								Chỉ chỉnh sửa họ tên, vai trò và ảnh đại diện.
							</p>
						</div>

						<div className="p-6 space-y-4 overflow-y-auto">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="text-sm font-medium text-secondary-700">Email</label>
									<input value={editingAccount.email} className="input mt-1 bg-secondary-50" disabled />
								</div>
								<div>
									<label className="text-sm font-medium text-secondary-700">Số điện thoại</label>
									<input value={editingAccount.phone} className="input mt-1 bg-secondary-50" disabled />
								</div>
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">
									Họ tên <span className="text-red-500">*</span>
								</label>
								<input
									value={formValues.fullName}
									onChange={(event) => onChangeField('fullName', event.target.value)}
									className={cn('input mt-1', formErrors.fullName && 'input-error')}
									placeholder="Nhập họ tên"
								/>
								{formErrors.fullName && <p className="text-xs text-red-600 mt-1">{formErrors.fullName}</p>}
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">
									Vai trò <span className="text-red-500">*</span>
								</label>
								<select
									value={normalizeRole(formValues.role)}
									onChange={(event) => onChangeField('role', event.target.value)}
									className={cn('input mt-1', formErrors.role && 'input-error')}
								>
									{availableRoles.map((role) => (
										<option key={role} value={role}>
											{roleLabel(role)}
										</option>
									))}
								</select>
								{formErrors.role && <p className="text-xs text-red-600 mt-1">{formErrors.role}</p>}
							</div>

							<div>
								<label className="text-sm font-medium text-secondary-700">Ảnh đại diện</label>
								<div className="mt-2 flex items-start gap-3">
									<div className="w-20 h-20 rounded-xl border border-dashed border-border bg-secondary-50 overflow-hidden flex items-center justify-center">
										{avatarPreview ? (
											<img
												src={avatarPreview}
												alt="Avatar preview"
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
												onChange={handleUploadAvatar}
												className="hidden"
											/>
										</label>

										{avatarFile && (
											<button
												type="button"
												onClick={handleRemoveSelectedAvatar}
												className="btn btn-ghost btn-sm"
											>
												<X className="w-4 h-4" />
												Bỏ ảnh đã chọn
											</button>
										)}

										<p className="text-xs text-secondary-500">PNG/JPG, tối đa 2MB.</p>
									</div>
								</div>
								{formErrors.avtUrl && <p className="text-xs text-red-600 mt-1">{formErrors.avtUrl}</p>}
							</div>
						</div>

						<div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-white sticky bottom-0">
							<button type="button" onClick={closeEditModal} className="btn btn-outline btn-sm">
								Hủy bỏ
							</button>
							<button
								type="button"
								onClick={handleSubmitEdit}
								className="btn btn-primary btn-sm"
								disabled={submitting}
							>
								Sửa
							</button>
						</div>
					</div>
				</div>
			)}

			{deletingAccount && (
				<div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
						<div className="flex items-start gap-3">
							<div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-secondary-900">Xác nhận xóa tài khoản</h3>
								<p className="text-sm text-secondary-500 mt-1">
									Tài khoản <strong>{deletingAccount.fullName}</strong> sẽ được chuyển sang trạng thái{' '}
									<strong>Vô hiệu hóa</strong>.
								</p>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<button type="button" onClick={cancelDelete} className="btn btn-outline btn-sm">
								Hủy bỏ
							</button>
							<button
								type="button"
								onClick={confirmDisable}
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
