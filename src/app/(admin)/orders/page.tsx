'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import {
	getAdminOrderDetailApi,
	getAdminOrdersApi,
	updateAdminOrderStatusApi,
} from '@/api/order'
import type { AdminOrderResponse, AdminOrderStatus } from '@/types'

type OrderItem = {
	id: number | string
	customerName: string
	phone: string
	address: string
	wardName: string
	totalAmount: number
	shippingFee: number
	finalAmount: number
	orderStatus: AdminOrderStatus
	paymentStatus: string
	createdAt: string
	items: AdminOrderResponse['items']
}

type SortKey = 'createdAt' | 'paymentStatus' | 'orderStatus' | null

const STATUS_OPTIONS: Array<{ value: AdminOrderStatus; label: string }> = [
	{ value: 'PENDING', label: 'Chờ xác nhận' },
	{ value: 'CONFIRMED', label: 'Đã xác nhận' },
	{ value: 'DELIVERING', label: 'Đang giao' },
	{ value: 'COMPLETED', label: 'Hoàn thành' },
	{ value: 'CANCELLED', label: 'Đã hủy' },
]

const STATUS_LABEL: Record<AdminOrderStatus, string> = {
	PENDING: 'Chờ xác nhận',
	CONFIRMED: 'Đã xác nhận',
	DELIVERING: 'Đang giao',
	COMPLETED: 'Hoàn thành',
	CANCELLED: 'Đã hủy',
}

const STATUS_SELECT_CLASS: Record<AdminOrderStatus, string> = {
	PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
	CONFIRMED: 'border-sky-200 bg-sky-50 text-sky-800',
	DELIVERING: 'border-cyan-200 bg-cyan-50 text-cyan-800',
	COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
	CANCELLED: 'border-rose-200 bg-rose-50 text-rose-800',
}

const PAYMENT_BADGE: Record<string, string> = {
	UNPAID: 'bg-amber-100 text-amber-700',
	PENDING: 'bg-sky-100 text-sky-700',
	PAID: 'bg-emerald-100 text-emerald-700',
	FAILED: 'bg-rose-100 text-rose-700',
	REFUNDED: 'bg-zinc-200 text-zinc-700',
}

function normalizeStatus(value: unknown): AdminOrderStatus {
	const raw = String(value ?? '').trim().toUpperCase()
	const allowed: AdminOrderStatus[] = ['PENDING', 'CONFIRMED', 'DELIVERING', 'COMPLETED', 'CANCELLED']
	return allowed.includes(raw as AdminOrderStatus) ? (raw as AdminOrderStatus) : 'PENDING'
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

function mapApiOrder(item: AdminOrderResponse): OrderItem {
	return {
		id: item.orderId,
		customerName: item.customerName ?? '---',
		phone: item.phone ?? '---',
		address: item.address ?? '---',
		wardName: item.wardName ?? '---',
		totalAmount: Number(item.totalAmount || 0),
		shippingFee: Number(item.shippingFee || 0),
		finalAmount: Number(item.finalAmount || 0),
		orderStatus: normalizeStatus(item.orderStatus),
		paymentStatus: String(item.paymentStatus ?? 'UNPAID').toUpperCase(),
		createdAt: formatDateTime(item.createdAt),
		items: item.items ?? [],
	}
}

export default function AdminOrdersPage() {
	const [orders, setOrders] = useState<OrderItem[]>([])
	const [loading, setLoading] = useState(true)
	const [query, setQuery] = useState('')
	const [sortKey, setSortKey] = useState<SortKey>(null)
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
	const [currentPage, setCurrentPage] = useState(1)
	const [statusDrafts, setStatusDrafts] = useState<Record<string, AdminOrderStatus>>({})
	const [updatingId, setUpdatingId] = useState<string>('')
	const [confirmStatusChange, setConfirmStatusChange] = useState<{
		orderId: string
		nextStatus: AdminOrderStatus
	} | null>(null)

	const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)
	const [detailLoading, setDetailLoading] = useState(false)

	const itemsPerPage = 10

	const filteredOrders = useMemo(() => {
		const keyword = query.trim().toLowerCase()

		return orders.filter((order) => {
			const matchesKeyword =
				!keyword ||
				String(order.id).toLowerCase().includes(keyword) ||
				order.customerName.toLowerCase().includes(keyword) ||
				order.phone.toLowerCase().includes(keyword)

			return matchesKeyword
		})
	}, [orders, query])

	const sortedOrders = useMemo(() => {
		if (!sortKey) {
			return filteredOrders
		}

		const copied = [...filteredOrders]
		copied.sort((a, b) => {
			const valueA = String(a[sortKey] ?? '')
			const valueB = String(b[sortKey] ?? '')
			const result = valueA.localeCompare(valueB, 'vi', { numeric: true, sensitivity: 'base' })
			return sortDirection === 'asc' ? result : -result
		})

		return copied
	}, [filteredOrders, sortDirection, sortKey])

	const totalPages = Math.max(1, Math.ceil(sortedOrders.length / itemsPerPage))
	const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)

	const paginatedOrders = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		return sortedOrders.slice(startIndex, startIndex + itemsPerPage)
	}, [sortedOrders, currentPage])

	const pendingCount = useMemo(
		() => orders.filter((item) => item.orderStatus === 'PENDING').length,
		[orders]
	)

	const completedCount = useMemo(
		() => orders.filter((item) => item.orderStatus === 'COMPLETED').length,
		[orders]
	)

	const cancelledCount = useMemo(
		() => orders.filter((item) => item.orderStatus === 'CANCELLED').length,
		[orders]
	)

	const loadOrders = async () => {
		setLoading(true)
		try {
			const response = await getAdminOrdersApi()
			const mapped = response.map(mapApiOrder)
			setOrders(mapped)
			setStatusDrafts(
				Object.fromEntries(mapped.map((item) => [String(item.id), item.orderStatus])) as Record<string, AdminOrderStatus>
			)
			setCurrentPage(1)
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || 'Không thể tải danh sách đơn hàng.'
			toast.error(message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadOrders()
	}, [])

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const openDetail = async (orderId: number | string) => {
		setDetailOpen(true)
		setDetailLoading(true)
		try {
			const response = await getAdminOrderDetailApi(orderId)
			setSelectedOrder(mapApiOrder(response))
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || 'Không thể tải chi tiết đơn hàng.'
			toast.error(message)
			setDetailOpen(false)
		} finally {
			setDetailLoading(false)
		}
	}

	const closeDetail = () => {
		setDetailOpen(false)
		setSelectedOrder(null)
	}

	const updateStatus = async (orderId: string, nextStatus: AdminOrderStatus) => {
		const order = orders.find((item) => String(item.id) === orderId)
		if (!order || nextStatus === order.orderStatus) {
			setConfirmStatusChange(null)
			return
		}

		setUpdatingId(orderId)
		try {
			const response = await updateAdminOrderStatusApi(order.id, { orderStatus: nextStatus })
			const mapped = mapApiOrder(response)
			setOrders((prev) => prev.map((item) => (String(item.id) === orderId ? mapped : item)))
			setStatusDrafts((prev) => ({ ...prev, [orderId]: mapped.orderStatus }))
			if (selectedOrder && String(selectedOrder.id) === orderId) {
				setSelectedOrder(mapped)
			}
			toast.success('Cập nhật trạng thái đơn hàng thành công.')
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái đơn hàng.'
			toast.error(message)
			setStatusDrafts((prev) => ({ ...prev, [orderId]: order.orderStatus }))
		} finally {
			setUpdatingId('')
			setConfirmStatusChange(null)
		}
	}

	const onChangeStatusDraft = (order: OrderItem, rawStatus: string) => {
		const orderKey = String(order.id)
		const nextStatus = normalizeStatus(rawStatus)

		setStatusDrafts((prev) => ({ ...prev, [orderKey]: nextStatus }))

		if (nextStatus !== order.orderStatus) {
			setConfirmStatusChange({ orderId: orderKey, nextStatus })
		}
	}

	const cancelConfirmUpdate = () => {
		if (confirmStatusChange) {
			const currentOrder = orders.find((item) => String(item.id) === confirmStatusChange.orderId)
			if (currentOrder) {
				setStatusDrafts((prev) => ({
					...prev,
					[confirmStatusChange.orderId]: currentOrder.orderStatus,
				}))
			}
		}
		setConfirmStatusChange(null)
	}

	const handleSortColumn = (nextKey: Exclude<SortKey, null>) => {
		setCurrentPage(1)
		if (sortKey === nextKey) {
			setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
			return
		}

		setSortKey(nextKey)
		setSortDirection('asc')
	}

	return (
		<div className="space-y-6">
			<section className="card p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-secondary-900">Quản lý đơn hàng</h2>
						<p className="mt-1 text-sm text-secondary-500">
							Theo dõi danh sách đơn hàng, xem chi tiết và cập nhật trạng thái xử lý.
						</p>
					</div>

					<button type="button" onClick={loadOrders} className="btn btn-outline btn-sm">
						<RefreshCw className="h-4 w-4" />
						Tải lại
					</button>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
					<div className="rounded-xl border border-border bg-secondary-50 p-3">
						<p className="text-xs text-secondary-500">Tổng đơn hàng</p>
						<p className="text-2xl font-bold text-secondary-900">{orders.length}</p>
					</div>
					<div className="rounded-xl border border-border bg-amber-50 p-3">
						<p className="text-xs text-amber-700">Chờ xác nhận</p>
						<p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
					</div>
					<div className="rounded-xl border border-border bg-emerald-50 p-3">
						<p className="text-xs text-emerald-700">Đã giao</p>
						<p className="text-2xl font-bold text-emerald-700">{completedCount}</p>
					</div>
					<div className="rounded-xl border border-border bg-rose-50 p-3">
						<p className="text-xs text-rose-700">Đã hủy</p>
						<p className="text-2xl font-bold text-rose-700">{cancelledCount}</p>
					</div>
				</div>
			</section>

			<section className="card p-5">
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h3 className="font-semibold text-secondary-900">Danh sách đơn hàng</h3>
					<input
						value={query}
						onChange={(event) => {
							setQuery(event.target.value)
							setCurrentPage(1)
						}}
						placeholder="Tìm theo mã đơn, tên khách hoặc sđt"
						className="input sm:w-80"
					/>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-[940px] w-full text-sm">
						<thead>
							<tr className="border-b border-border text-secondary-500">
								<th className="px-2 py-3 text-left font-medium">Mã đơn</th>
								<th className="px-2 py-3 text-left font-medium">Khách hàng</th>
								<th className="px-2 py-3 text-left font-medium">SĐT</th>
								<th className="w-[140px] px-2 py-3 text-left font-medium">Tổng thanh toán</th>
								<th className="w-[150px] px-2 py-3 text-left font-medium">
									<button
										type="button"
										onClick={() => handleSortColumn('createdAt')}
										className="inline-flex items-center gap-1 text-secondary-500 hover:text-secondary-800"
									>
										Ngày tạo
										<span className="flex flex-col leading-none">
											<ChevronUp className={`h-3 w-3 ${sortKey === 'createdAt' && sortDirection === 'asc' ? 'text-primary' : 'text-secondary-300'}`} />
											<ChevronDown className={`h-3 w-3 -mt-1 ${sortKey === 'createdAt' && sortDirection === 'desc' ? 'text-primary' : 'text-secondary-300'}`} />
										</span>
									</button>
								</th>
								<th className="px-2 py-3 text-left font-medium">
									<button
										type="button"
										onClick={() => handleSortColumn('paymentStatus')}
										className="inline-flex items-center gap-1 text-secondary-500 hover:text-secondary-800"
									>
										Thanh toán
										<span className="flex flex-col leading-none">
											<ChevronUp className={`h-3 w-3 ${sortKey === 'paymentStatus' && sortDirection === 'asc' ? 'text-primary' : 'text-secondary-300'}`} />
											<ChevronDown className={`h-3 w-3 -mt-1 ${sortKey === 'paymentStatus' && sortDirection === 'desc' ? 'text-primary' : 'text-secondary-300'}`} />
										</span>
									</button>
								</th>
								<th className="px-2 py-3 text-left font-medium">
									<button
										type="button"
										onClick={() => handleSortColumn('orderStatus')}
										className="inline-flex items-center gap-1 text-secondary-500 hover:text-secondary-800"
									>
										Trạng thái
										<span className="flex flex-col leading-none">
											<ChevronUp className={`h-3 w-3 ${sortKey === 'orderStatus' && sortDirection === 'asc' ? 'text-primary' : 'text-secondary-300'}`} />
											<ChevronDown className={`h-3 w-3 -mt-1 ${sortKey === 'orderStatus' && sortDirection === 'desc' ? 'text-primary' : 'text-secondary-300'}`} />
										</span>
									</button>
								</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={7}>
										Đang tải danh sách đơn hàng...
									</td>
								</tr>
							) : paginatedOrders.length === 0 ? (
								<tr>
									<td className="py-8 text-center text-secondary-500" colSpan={7}>
										Không có đơn hàng phù hợp.
									</td>
								</tr>
							) : (
								paginatedOrders.map((order) => {
									const orderKey = String(order.id)
									const draftStatus = statusDrafts[orderKey] ?? order.orderStatus

									return (
										<tr
											key={orderKey}
											onClick={() => openDetail(order.id)}
											className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary-50"
										>
											<td className="px-2 py-3 font-semibold text-secondary-700">#{order.id}</td>
											<td className="px-2 py-3 text-secondary-900">{order.customerName}</td>
											<td className="px-2 py-3 text-secondary-700">{order.phone}</td>
											<td className="whitespace-nowrap px-2 py-3 text-secondary-900">{formatCurrency(order.finalAmount)}</td>
											<td className="whitespace-nowrap px-2 py-3 text-secondary-500">{order.createdAt}</td>
											<td className="px-2 py-3">
												<span className={`badge ${PAYMENT_BADGE[order.paymentStatus] || 'bg-zinc-100 text-zinc-700'}`}>
													{order.paymentStatus}
												</span>
											</td>
											<td className="px-2 py-3">
												<select
													value={draftStatus}
													onChange={(event) => onChangeStatusDraft(order, event.target.value)}
													onClick={(event) => event.stopPropagation()}
													onMouseDown={(event) => event.stopPropagation()}
													className={`min-w-[150px] rounded-lg border px-3 py-2 text-sm font-semibold transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-secondary-100 disabled:text-secondary-500 ${STATUS_SELECT_CLASS[draftStatus]}`}
													disabled={updatingId === orderKey}
												>
													{STATUS_OPTIONS.map((status) => (
														<option key={status.value} value={status.value}>
															{status.label}
														</option>
													))}
												</select>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{sortedOrders.length > 0 && !loading && (
					<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-secondary-500">
							Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
							{Math.min(currentPage * itemsPerPage, sortedOrders.length)} / {sortedOrders.length} đơn hàng
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

			{confirmStatusChange && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-xl">
						<h4 className="text-base font-semibold text-secondary-900">Xác nhận cập nhật trạng thái</h4>
						<p className="mt-2 text-sm text-secondary-600">
							Bạn có chắc muốn cập nhật đơn #{confirmStatusChange.orderId} sang trạng thái 
							 <span className="font-semibold"> {STATUS_LABEL[confirmStatusChange.nextStatus]}</span>?
						</p>
						<div className="mt-4 flex justify-end gap-2">
							<button type="button" onClick={cancelConfirmUpdate} className="btn btn-outline btn-sm">
								Hủy
							</button>
							<button
								type="button"
								onClick={() => updateStatus(confirmStatusChange.orderId, confirmStatusChange.nextStatus)}
								disabled={updatingId === confirmStatusChange.orderId}
								className="btn btn-primary btn-sm"
							>
								Cập nhật
							</button>
						</div>
					</div>
				</div>
			)}

			{detailOpen && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
						<div className="flex items-center justify-between border-b border-border px-6 py-4">
							<div>
								<h3 className="text-lg font-semibold text-secondary-900">Chi tiết đơn hàng</h3>
								<p className="mt-1 text-sm text-secondary-500">Thông tin đơn hàng và danh sách món đã đặt.</p>
							</div>
							<button type="button" onClick={closeDetail} className="btn btn-ghost btn-sm">
								<X className="h-4 w-4" />
							</button>
						</div>

						{detailLoading || !selectedOrder ? (
							<div className="p-6 text-sm text-secondary-500">Đang tải chi tiết đơn hàng...</div>
						) : (
							<div className="space-y-4 p-6">
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div className="rounded-xl border border-border bg-secondary-50 p-3">
										<p className="text-xs text-secondary-500">Mã đơn hàng</p>
										<p className="font-semibold text-secondary-900">#{selectedOrder.id}</p>
									</div>
									<div className="rounded-xl border border-border bg-secondary-50 p-3">
										<p className="text-xs text-secondary-500">Ngày tạo</p>
										<p className="font-semibold text-secondary-900">{selectedOrder.createdAt}</p>
									</div>
									<div className="rounded-xl border border-border bg-secondary-50 p-3">
										<p className="text-xs text-secondary-500">Khách hàng</p>
										<p className="font-semibold text-secondary-900">{selectedOrder.customerName}</p>
										<p className="text-sm text-secondary-600 mt-1">{selectedOrder.phone}</p>
									</div>
									<div className="rounded-xl border border-border bg-secondary-50 p-3">
										<p className="text-xs text-secondary-500">Địa chỉ giao hàng</p>
										<p className="font-semibold text-secondary-900">{selectedOrder.wardName}</p>
										<p className="text-sm text-secondary-600 mt-1">{selectedOrder.address}</p>
									</div>
								</div>

								<div className="overflow-x-auto">
									<table className="w-full text-sm min-w-[700px]">
										<thead>
											<tr className="border-b border-border text-secondary-500">
												<th className="py-3 px-2 text-left font-medium">Món ăn</th>
												<th className="py-3 px-2 text-left font-medium">Size</th>
												<th className="py-3 px-2 text-left font-medium">Topping</th>
												<th className="py-3 px-2 text-left font-medium">SL</th>
												<th className="py-3 px-2 text-left font-medium">Thành tiền</th>
											</tr>
										</thead>
										<tbody>
											{selectedOrder.items.map((item, index) => (
												<tr key={`${item.menuName}-${index}`} className="border-b border-border last:border-0">
													<td className="py-3 px-2 text-secondary-900 font-medium">{item.menuName}</td>
													<td className="py-3 px-2 text-secondary-700">{item.sizeName || '--'}</td>
													<td className="py-3 px-2 text-secondary-700">{item.toppings?.join(', ') || '--'}</td>
													<td className="py-3 px-2 text-secondary-700">{item.quantity}</td>
													<td className="py-3 px-2 text-secondary-900">{formatCurrency(Number(item.itemTotal || 0))}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
									<div className="rounded-xl border border-border bg-secondary-50 p-3">
										<p className="text-xs text-secondary-500">Tạm tính</p>
										<p className="font-semibold text-secondary-900">{formatCurrency(selectedOrder.totalAmount)}</p>
									</div>
									<div className="rounded-xl border border-border bg-secondary-50 p-3">
										<p className="text-xs text-secondary-500">Phí giao hàng</p>
										<p className="font-semibold text-secondary-900">{formatCurrency(selectedOrder.shippingFee)}</p>
									</div>
									<div className="rounded-xl border border-border bg-emerald-50 p-3">
										<p className="text-xs text-emerald-700">Tổng thanh toán</p>
										<p className="font-semibold text-emerald-700">{formatCurrency(selectedOrder.finalAmount)}</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
