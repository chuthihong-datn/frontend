'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Pencil, Plus, RefreshCw, Search, TicketPercent, Trash2, Zap, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { getAdminMenusApi } from '@/api/adminMenu'
import {
  createAdminFlashSaleApi,
  createAdminVoucherApi,
  deleteAdminFlashSaleApi,
  deleteAdminVoucherApi,
  getAdminFlashSalesApi,
  getAdminVouchersApi,
  updateAdminFlashSaleApi,
  updateAdminVoucherApi,
} from '@/api/adminPromotion'
import type {
  AdminFlashSaleRequest,
  AdminFlashSaleResponse,
  AdminVoucherRequest,
  AdminVoucherResponse,
} from '@/types'

type PromotionTab = 'voucher' | 'flash-sale'
type ModalMode = 'create' | 'edit' | null

type MenuOption = {
  id: number
  name: string
  amount: number
}

type VoucherFormValues = {
  code: string
  title: string
  description: string
  discountType: string
  discountValue: string
  maxDiscount: string
  minOrderAmount: string
  startDate: string
  endDate: string
  usageLimit: string
  isActive: boolean
}

type FlashSaleFormValues = {
  title: string
  description: string
  discountType: string
  discountValue: string
  maxDiscount: string
  minOrderAmount: string
  maxQuantityPerOrder: string
  minStock: string
  startTime: string
  endTime: string
  menuIds: number[]
  isActive: boolean
}

type VoucherErrors = Partial<Record<keyof VoucherFormValues, string>>
type FlashSaleErrors = Partial<Record<keyof FlashSaleFormValues, string>>

type DeleteTarget =
  | { type: 'voucher'; id: number | string; name: string }
  | { type: 'flash-sale'; id: number | string; name: string }
  | null

const DISCOUNT_OPTIONS = [
  { value: 'PERCENT', label: 'Giảm theo phần trăm' },
  { value: 'FIXED', label: 'Giảm số tiền cố định' },
]

const EMPTY_VOUCHER_FORM: VoucherFormValues = {
  code: '',
  title: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  isActive: true,
}

const EMPTY_FLASH_FORM: FlashSaleFormValues = {
  title: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  maxQuantityPerOrder: '1',
  minStock: '',
  startTime: '',
  endTime: '',
  menuIds: [],
  isActive: true,
}

function normalizeDateTime(value?: string | null): string {
  if (!value) {
    return ''
  }

  return value.replace(' ', 'T').slice(0, 16)
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value.replace('T', ' ').slice(0, 16)
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeDiscountTypeForBackend(value: string): string {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'PERCENTAGE') {
    return 'PERCENT'
  }
  if (normalized === 'FIXED_AMOUNT') {
    return 'FIXED'
  }
  return normalized || 'PERCENT'
}

function toLocalDateTimePayload(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  // Spring LocalDateTime mapping is safer with explicit seconds.
  return trimmed.length === 16 ? `${trimmed}:00` : trimmed
}

function formatDiscount(type: string, value: number): string {
  const normalized = String(type || '').toUpperCase()
  if (normalized === 'PERCENT' || normalized === 'PERCENTAGE') {
    return `${value}%`
  }

  return formatPrice(value)
}

function mapVoucherResponse(item: AdminVoucherResponse): AdminVoucherResponse {
  return {
    ...item,
    discountType: String(item.discountType || 'PERCENT').toUpperCase(),
    discountValue: Number(item.discountValue || 0),
    maxDiscount: item.maxDiscount == null ? null : Number(item.maxDiscount),
    minOrderAmount: item.minOrderAmount == null ? null : Number(item.minOrderAmount),
    usageLimit: item.usageLimit == null ? null : Number(item.usageLimit),
    isActive: Boolean(item.isActive),
  }
}

function mapFlashSaleResponse(item: AdminFlashSaleResponse): AdminFlashSaleResponse {
  return {
    ...item,
    discountType: String(item.discountType || 'PERCENT').toUpperCase(),
    discountValue: Number(item.discountValue || 0),
    maxDiscount: item.maxDiscount == null ? null : Number(item.maxDiscount),
    minOrderAmount: item.minOrderAmount == null ? null : Number(item.minOrderAmount),
    maxQuantityPerOrder: item.maxQuantityPerOrder == null ? null : Number(item.maxQuantityPerOrder),
    minStock: item.minStock == null ? null : Number(item.minStock),
    menuNames: item.menuNames || [],
    isActive: Boolean(item.isActive),
  }
}

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<PromotionTab>('voucher')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)

  const [vouchers, setVouchers] = useState<AdminVoucherResponse[]>([])
  const [flashSales, setFlashSales] = useState<AdminFlashSaleResponse[]>([])
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([])

  const [voucherForm, setVoucherForm] = useState<VoucherFormValues>(EMPTY_VOUCHER_FORM)
  const [flashForm, setFlashForm] = useState<FlashSaleFormValues>(EMPTY_FLASH_FORM)
  const [voucherErrors, setVoucherErrors] = useState<VoucherErrors>({})
  const [flashErrors, setFlashErrors] = useState<FlashSaleErrors>({})
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucherResponse | null>(null)
  const [editingFlashSale, setEditingFlashSale] = useState<AdminFlashSaleResponse | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [voucherResult, flashSaleResult, menuResult] = await Promise.allSettled([
        getAdminVouchersApi(),
        getAdminFlashSalesApi(),
        getAdminMenusApi(),
      ])

      if (voucherResult.status === 'fulfilled') {
        setVouchers((voucherResult.value || []).map(mapVoucherResponse))
      } else {
        toast.error('Không thể tải danh sách voucher.')
      }

      if (flashSaleResult.status === 'fulfilled') {
        setFlashSales((flashSaleResult.value || []).map(mapFlashSaleResponse))
      } else {
        toast.error('Không thể tải danh sách flash sale.')
      }

      if (menuResult.status === 'fulfilled') {
        setMenuOptions(
          (menuResult.value || [])
            .filter((menu) => !menu.deleted)
            .map((menu) => ({ id: Number(menu.menuId), name: menu.name, amount: Number(menu.amount || 0) }))
            .filter((menu) => Number.isFinite(menu.id))
        )
      } else {
        toast.error('Không thể tải danh sách món ăn.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, query])

  const filteredVouchers = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return vouchers
    return vouchers.filter((item) => {
      return `${item.code} ${item.title} ${item.description}`.toLowerCase().includes(keyword)
    })
  }, [query, vouchers])

  const filteredFlashSales = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return flashSales
    return flashSales.filter((item) => {
      return `${item.title} ${item.description} ${(item.menuNames || []).join(' ')}`
        .toLowerCase()
        .includes(keyword)
    })
  }, [query, flashSales])

  const filteredData = activeTab === 'voucher' ? filteredVouchers : filteredFlashSales
  const itemsPerPage = 8
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const currentData = activeTab === 'voucher' ? vouchers : flashSales
  const activeCount = currentData.filter((item) => item.isActive).length
  const inactiveCount = currentData.length - activeCount

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const resetForms = () => {
    setVoucherForm(EMPTY_VOUCHER_FORM)
    setFlashForm(EMPTY_FLASH_FORM)
    setVoucherErrors({})
    setFlashErrors({})
    setEditingVoucher(null)
    setEditingFlashSale(null)
  }

  const openCreateModal = () => {
    resetForms()
    setModalMode('create')
  }

  const openEditModal = (item: AdminVoucherResponse | AdminFlashSaleResponse) => {
    resetForms()
    setModalMode('edit')

    if (activeTab === 'voucher') {
      const voucher = item as AdminVoucherResponse
      setEditingVoucher(voucher)
      setVoucherForm({
        code: voucher.code || '',
        title: voucher.title || '',
        description: voucher.description || '',
        discountType: String(voucher.discountType || 'PERCENT').toUpperCase(),
        discountValue: String(voucher.discountValue ?? ''),
        maxDiscount: voucher.maxDiscount == null ? '' : String(voucher.maxDiscount),
        minOrderAmount: voucher.minOrderAmount == null ? '' : String(voucher.minOrderAmount),
        startDate: normalizeDateTime(voucher.startDate),
        endDate: normalizeDateTime(voucher.endDate),
        usageLimit: voucher.usageLimit == null ? '' : String(voucher.usageLimit),
        isActive: Boolean(voucher.isActive),
      })
      return
    }

    const flashSale = item as AdminFlashSaleResponse
    setEditingFlashSale(flashSale)
    setFlashForm({
      title: flashSale.title || '',
      description: flashSale.description || '',
      discountType: String(flashSale.discountType || 'PERCENT').toUpperCase(),
      discountValue: String(flashSale.discountValue ?? ''),
      maxDiscount: flashSale.maxDiscount == null ? '' : String(flashSale.maxDiscount),
      minOrderAmount: flashSale.minOrderAmount == null ? '' : String(flashSale.minOrderAmount),
      maxQuantityPerOrder:
        flashSale.maxQuantityPerOrder == null ? '1' : String(flashSale.maxQuantityPerOrder),
      minStock: flashSale.minStock == null ? '' : String(flashSale.minStock),
      startTime: normalizeDateTime(flashSale.startTime),
      endTime: normalizeDateTime(flashSale.endTime),
      menuIds: (flashSale.menuNames || [])
        .map((name) => menuOptions.find((menu) => menu.name === name)?.id)
        .filter((id): id is number => typeof id === 'number' && Number.isFinite(id)),
      isActive: Boolean(flashSale.isActive),
    })
  }

  const closeModal = () => {
    setModalMode(null)
    resetForms()
  }

  const buildVoucherPayload = (): AdminVoucherRequest => ({
    code: voucherForm.code.trim().toUpperCase(),
    title: voucherForm.title.trim(),
    description: voucherForm.description.trim(),
    discountType: normalizeDiscountTypeForBackend(voucherForm.discountType),
    discountValue: Number(voucherForm.discountValue),
    maxDiscount: parseOptionalNumber(voucherForm.maxDiscount),
    minOrderAmount: parseOptionalNumber(voucherForm.minOrderAmount),
    startDate: voucherForm.startDate,
    endDate: voucherForm.endDate,
    usageLimit: parseOptionalNumber(voucherForm.usageLimit),
    isActive: voucherForm.isActive,
  })

  const buildFlashSalePayload = (): AdminFlashSaleRequest => ({
    title: flashForm.title.trim(),
    description: flashForm.description.trim(),
    discountType: normalizeDiscountTypeForBackend(flashForm.discountType),
    discountValue: Number(flashForm.discountValue),
    maxDiscount: parseOptionalNumber(flashForm.maxDiscount)  ?? 0,
    minOrderAmount: parseOptionalNumber(flashForm.minOrderAmount) ?? 0,
    maxQuantityPerOrder: parseOptionalNumber(flashForm.maxQuantityPerOrder) ?? 1,
    minStock: parseOptionalNumber(flashForm.minStock) ?? 0,
    startTime: toLocalDateTimePayload(flashForm.startTime),
    endTime: toLocalDateTimePayload(flashForm.endTime),
    isActive: flashForm.isActive,
    menuIds: flashForm.menuIds,
  })

  const validateVoucher = () => {
    const nextErrors: VoucherErrors = {}
    if (!voucherForm.code.trim()) nextErrors.code = 'Mã voucher là bắt buộc.'
    if (!voucherForm.title.trim()) nextErrors.title = 'Tiêu đề là bắt buộc.'
    if (!voucherForm.discountValue.trim()) nextErrors.discountValue = 'Giá trị giảm là bắt buộc.'
    if (!voucherForm.startDate.trim()) nextErrors.startDate = 'Thời gian bắt đầu là bắt buộc.'
    if (!voucherForm.endDate.trim()) nextErrors.endDate = 'Thời gian kết thúc là bắt buộc.'
    if (voucherForm.startDate && voucherForm.endDate && voucherForm.startDate >= voucherForm.endDate) {
      nextErrors.endDate = 'Thời gian kết thúc phải sau thời gian bắt đầu.'
    }

    setVoucherErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateFlashSale = () => {
    const nextErrors: FlashSaleErrors = {}
    if (!flashForm.title.trim()) nextErrors.title = 'Tiêu đề là bắt buộc.'
    if (!flashForm.discountValue.trim()) nextErrors.discountValue = 'Giá trị giảm là bắt buộc.'
    if (!flashForm.startTime.trim()) nextErrors.startTime = 'Thời gian bắt đầu là bắt buộc.'
    if (!flashForm.endTime.trim()) nextErrors.endTime = 'Thời gian kết thúc là bắt buộc.'
    if (flashForm.startTime && flashForm.endTime && flashForm.startTime >= flashForm.endTime) {
      nextErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu.'
    }
    if (flashForm.menuIds.length === 0) {
      nextErrors.menuIds = 'Vui lòng chọn ít nhất một món áp dụng.'
    }

    const minStockNumber = parseOptionalNumber(flashForm.minStock) ?? 0
    if (minStockNumber > 0 && flashForm.menuIds.length > 0) {
      const lowStockMenus = menuOptions
        .filter((menu) => flashForm.menuIds.includes(menu.id) && menu.amount < minStockNumber)
        .map((menu) => menu.name)

      if (lowStockMenus.length > 0) {
        nextErrors.minStock = `Các món chưa đủ tồn kho tối thiểu ${minStockNumber}: ${lowStockMenus.join(', ')}`
      }
    }

    setFlashErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (activeTab === 'voucher') {
        if (!validateVoucher()) {
          return
        }

        const payload = buildVoucherPayload()
        if (modalMode === 'create') {
          await createAdminVoucherApi(payload)
          toast.success('Tạo voucher thành công.')
        } else if (editingVoucher) {
          await updateAdminVoucherApi(editingVoucher.voucherId, payload)
          toast.success('Cập nhật voucher thành công.')
        }
      } else {
        if (!validateFlashSale()) {
          return
        }

        const payload = buildFlashSalePayload()
        if (modalMode === 'create') {
          await createAdminFlashSaleApi(payload)
          toast.success('Tạo flash sale thành công.')
        } else if (editingFlashSale) {
          await updateAdminFlashSaleApi(editingFlashSale.flashSaleId, payload)
          toast.success('Cập nhật flash sale thành công.')
        }
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể lưu chương trình.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setSubmitting(true)
    try {
      if (deleteTarget.type === 'voucher') {
        await deleteAdminVoucherApi(deleteTarget.id)
        toast.success('Xóa voucher thành công.')
      } else {
        await deleteAdminFlashSaleApi(deleteTarget.id)
        toast.success('Xóa flash sale thành công.')
      }

      setDeleteTarget(null)
      await loadData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể xóa chương trình.')
    } finally {
      setSubmitting(false)
    }
  }

  const currentPageLabel = `${currentPage}/${totalPages}`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900">Quản lý khuyến mãi</h2>
          <p className="text-sm text-secondary-500 mt-1">Quản lý voucher và flash sale theo đúng API của hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-outline btn-md" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button type="button" className="btn-primary btn-md" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Tổng số</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{currentData.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Đang hoạt động</p>
          <p className="text-2xl font-bold text-success mt-1">{activeCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Không hoạt động</p>
          <p className="text-2xl font-bold text-secondary-700 mt-1">{inactiveCount}</p>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex rounded-xl bg-secondary-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('voucher')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === 'voucher' ? 'bg-white shadow-sm text-secondary-900' : 'text-secondary-500'
              }`}
            >
              <TicketPercent className="w-4 h-4 inline-block mr-1" />
              Voucher
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('flash-sale')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === 'flash-sale' ? 'bg-white shadow-sm text-secondary-900' : 'text-secondary-500'
              }`}
            >
              <Zap className="w-4 h-4 inline-block mr-1" />
              Flash Sale
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              className="input pl-9"
              placeholder="Tìm kiếm theo mã, tiêu đề, mô tả"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto border border-border rounded-xl">
          {loading ? (
            <div className="py-10 text-center text-secondary-500">Đang tải dữ liệu...</div>
          ) : paginatedData.length === 0 ? (
            <div className="py-10 text-center text-secondary-500">Không có dữ liệu phù hợp.</div>
          ) : activeTab === 'voucher' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary-50">
                  <th className="text-left px-3 py-3">Mã</th>
                  <th className="text-left px-3 py-3">Tiêu đề</th>
                  <th className="text-left px-3 py-3">Giảm giá</th>
                  <th className="text-left px-3 py-3">Thời gian</th>
                  <th className="text-left px-3 py-3">Trạng thái</th>
                  <th className="text-right px-3 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(paginatedData as AdminVoucherResponse[]).map((item) => (
                  <tr key={String(item.voucherId)} className="border-b border-border last:border-0">
                    <td className="px-3 py-3 font-semibold text-secondary-900">{item.code}</td>
                    <td className="px-3 py-3">{item.title}</td>
                    <td className="px-3 py-3">{formatDiscount(item.discountType, Number(item.discountValue || 0))}</td>
                    <td className="px-3 py-3 text-xs text-secondary-600">
                      <div>{formatDateTime(item.startDate)}</div>
                      <div>{formatDateTime(item.endDate)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`badge ${
                          item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {item.isActive ? 'Hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" className="p-2 hover:bg-secondary-100 rounded-lg" onClick={() => openEditModal(item)}>
                          <Pencil className="w-4 h-4 text-secondary-600" />
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-red-50 rounded-lg"
                          onClick={() => setDeleteTarget({ type: 'voucher', id: item.voucherId, name: item.title })}
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary-50">
                  <th className="text-left px-3 py-3">Tiêu đề</th>
                  <th className="text-left px-3 py-3">Món áp dụng</th>
                  <th className="text-left px-3 py-3">Giảm giá</th>
                  <th className="text-left px-3 py-3">Thời gian</th>
                  <th className="text-left px-3 py-3">Trạng thái</th>
                  <th className="text-right px-3 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(paginatedData as AdminFlashSaleResponse[]).map((item) => (
                  <tr key={String(item.flashSaleId)} className="border-b border-border last:border-0">
                    <td className="px-3 py-3 font-semibold text-secondary-900">{item.title}</td>
                    <td className="px-3 py-3 text-xs text-secondary-600">
                      {(item.menuNames || []).length > 0 ? item.menuNames.join(', ') : '--'}
                    </td>
                    <td className="px-3 py-3">{formatDiscount(item.discountType, Number(item.discountValue || 0))}</td>
                    <td className="px-3 py-3 text-xs text-secondary-600">
                      <div>{formatDateTime(item.startTime)}</div>
                      <div>{formatDateTime(item.endTime)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`badge ${
                          item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {item.isActive ? 'Hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" className="p-2 hover:bg-secondary-100 rounded-lg" onClick={() => openEditModal(item)}>
                          <Pencil className="w-4 h-4 text-secondary-600" />
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-red-50 rounded-lg"
                          onClick={() => setDeleteTarget({ type: 'flash-sale', id: item.flashSaleId, name: item.title })}
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-secondary-500">Trang {currentPageLabel}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Trước
            </button>
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-border shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary-900">
                {modalMode === 'create' ? 'Thêm chương trình' : 'Chỉnh sửa chương trình'}
              </h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-secondary-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
              {activeTab === 'voucher' ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-secondary-600">Mã voucher <span className="text-error">*</span></label>
                    <input
                      className="input mt-1"
                      value={voucherForm.code}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                    />
                    {voucherErrors.code && <p className="text-error text-xs mt-1">{voucherErrors.code}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Tiêu đề <span className="text-error">*</span></label>
                    <input
                      className="input mt-1"
                      value={voucherForm.title}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                    {voucherErrors.title && <p className="text-error text-xs mt-1">{voucherErrors.title}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm text-secondary-600">Mô tả</label>
                    <textarea
                      className="input mt-1 h-24 resize-none"
                      value={voucherForm.description}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Loại giảm giá</label>
                    <select
                      className="input mt-1"
                      value={voucherForm.discountType}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, discountType: event.target.value }))}
                    >
                      {DISCOUNT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Giá trị giảm <span className="text-error">*</span></label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={voucherForm.discountValue}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                    />
                    {voucherErrors.discountValue && <p className="text-error text-xs mt-1">{voucherErrors.discountValue}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Giảm tối đa</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={voucherForm.maxDiscount}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, maxDiscount: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Đơn tối thiểu</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={voucherForm.minOrderAmount}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Bắt đầu <span className="text-error">*</span></label>
                    <input
                      type="datetime-local"
                      className="input mt-1"
                      value={voucherForm.startDate}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    />
                    {voucherErrors.startDate && <p className="text-error text-xs mt-1">{voucherErrors.startDate}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Kết thúc <span className="text-error">*</span></label>
                    <input
                      type="datetime-local"
                      className="input mt-1"
                      value={voucherForm.endDate}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    />
                    {voucherErrors.endDate && <p className="text-error text-xs mt-1">{voucherErrors.endDate}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Giới hạn lượt dùng</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={voucherForm.usageLimit}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Trạng thái</label>
                    <select
                      className="input mt-1"
                      value={voucherForm.isActive ? 'active' : 'inactive'}
                      onChange={(event) => setVoucherForm((prev) => ({ ...prev, isActive: event.target.value === 'active' }))}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ẩn</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-secondary-600">Tiêu đề <span className="text-error">*</span></label>
                    <input
                      className="input mt-1"
                      value={flashForm.title}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                    {flashErrors.title && <p className="text-error text-xs mt-1">{flashErrors.title}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Giảm tối đa trên đơn</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={flashForm.maxQuantityPerOrder}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, maxQuantityPerOrder: event.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm text-secondary-600">Mô tả</label>
                    <textarea
                      className="input mt-1 h-24 resize-none"
                      value={flashForm.description}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Loại giảm giá</label>
                    <select
                      className="input mt-1"
                      value={flashForm.discountType}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, discountType: event.target.value }))}
                    >
                      {DISCOUNT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Giá trị giảm <span className="text-error">*</span></label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={flashForm.discountValue}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                    />
                    {flashErrors.discountValue && <p className="text-error text-xs mt-1">{flashErrors.discountValue}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Giảm tối đa</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={flashForm.maxDiscount}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, maxDiscount: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Đơn tối thiểu</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={flashForm.minOrderAmount}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Bắt đầu <span className="text-error">*</span></label>
                    <input
                      type="datetime-local"
                      className="input mt-1"
                      value={flashForm.startTime}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, startTime: event.target.value }))}
                    />
                    {flashErrors.startTime && <p className="text-error text-xs mt-1">{flashErrors.startTime}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Kết thúc <span className="text-error">*</span></label>
                    <input
                      type="datetime-local"
                      className="input mt-1"
                      value={flashForm.endTime}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, endTime: event.target.value }))}
                    />
                    {flashErrors.endTime && <p className="text-error text-xs mt-1">{flashErrors.endTime}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Tồn kho tối thiểu</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={flashForm.minStock}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, minStock: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-secondary-600">Trạng thái</label>
                    <select
                      className="input mt-1"
                      value={flashForm.isActive ? 'active' : 'inactive'}
                      onChange={(event) => setFlashForm((prev) => ({ ...prev, isActive: event.target.value === 'active' }))}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ẩn</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm text-secondary-600">Món áp dụng <span className="text-error">*</span></label>
                    <div className="mt-1 border border-border rounded-xl p-3 max-h-44 overflow-auto grid sm:grid-cols-2 gap-2">
                      {menuOptions.map((menu) => {
                        const checked = flashForm.menuIds.includes(menu.id)
                        return (
                          <label key={menu.id} className="flex items-center gap-2 text-sm text-secondary-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setFlashForm((prev) => ({
                                  ...prev,
                                  menuIds: checked
                                    ? prev.menuIds.filter((id) => id !== menu.id)
                                    : [...prev.menuIds, menu.id],
                                }))
                              }
                            />
                            <span>{menu.name}</span>
                          </label>
                        )
                      })}
                    </div>
                    {flashErrors.menuIds && <p className="text-error text-xs mt-1">{flashErrors.menuIds}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border bg-secondary-50 flex items-center justify-end gap-2">
              <button type="button" className="btn-outline btn-md" onClick={closeModal} disabled={submitting}>
                Hủy
              </button>
              <button type="button" className="btn-primary btn-md" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-border shadow-xl overflow-hidden">
            <div className="p-5 flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">Xác nhận xóa</h3>
                <p className="text-sm text-secondary-600 mt-1">
                  Bạn có chắc muốn xóa <span className="font-medium">{deleteTarget.name}</span>?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border bg-secondary-50 flex justify-end gap-2">
              <button type="button" className="btn-outline btn-md" onClick={() => setDeleteTarget(null)} disabled={submitting}>
                Hủy
              </button>
              <button type="button" className="btn-primary btn-md" onClick={handleDelete} disabled={submitting}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
