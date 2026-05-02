'use client'

import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Trash2, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getCartApi, updateCartItemQuantityApi, deleteCartItemApi } from '@/api/cart'
import { createOrderApi } from '@/api/order'
import { getAllWardDeliveryApi } from '@/api/ward'
import { getMyVouchersApi } from '@/api/user'
import type { CartItemResponse, UserVoucherResponse, WardResponse } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import type { CartItem, Product, ProductSize, Topping } from '@/types'

const mapServerItemToStoreItem = (item: CartItemResponse): CartItem => {
  const quantity = Number(item.quantity) || 1
  const itemTotal = Number(item.itemTotal) || 0
  const hasFlashSale = item.isFlashSaleApplied === true || item.flashSaleApplied === true
  const saleQuantity = Number(item.saleQuantity) || (hasFlashSale ? 1 : 0)
  const salePriceValue = Number(item.salePrice) || 0
  
  // Recalculate unitPrice for regular items when flash sale is applied
  // to ensure size/topping prices are included
  let unitPrice = Number(item.price)
  if (hasFlashSale && saleQuantity > 0 && saleQuantity < quantity) {
    const regularQuantity = quantity - saleQuantity
    const saleSubtotal = salePriceValue * saleQuantity
    const regularSubtotal = itemTotal - saleSubtotal
    if (regularQuantity > 0) {
      unitPrice = regularSubtotal / regularQuantity
    }
  }

  const product: Product = {
    id: item.menuId ?? item.cartItemId,
    name: item.menuName,
    images: item.image ? [item.image] : [],
    rating: 0,
    minPrice: unitPrice,
  }

  const size: ProductSize | undefined = item.sizeName
    ? {
        id: 0,
        name: item.sizeName,
        extraPrice: 0,
      }
    : undefined

  const toppings: Topping[] = (item.toppings || []).map((name, index) => ({
    id: index + 1,
    name,
    price: 0,
  }))

  return {
    id: String(item.cartItemId),
    product,
    quantity,
    size,
    toppings,
    unitPrice,
    salePrice: Number.isFinite(salePriceValue) && salePriceValue > 0 ? salePriceValue : undefined,
    saleQuantity: Number.isFinite(saleQuantity) && saleQuantity > 0 ? saleQuantity : 0,
    isFlashSaleApplied: hasFlashSale,
    subtotal: itemTotal,
  }
}

const STORE_OPEN_HOUR = 8
const STORE_CLOSE_HOUR = 24
const STORE_HOURS_ERROR_MESSAGE = 'Cửa hàng chỉ nhận đơn từ 8:00 - 22:00'

function isStoreOpenNow(): boolean {
  const currentHour = new Date().getHours()
  return currentHour >= STORE_OPEN_HOUR && currentHour < STORE_CLOSE_HOUR
}

function normalizeStoreHoursError(message: string): string {
  const normalized = message.toLowerCase()

  if (
    normalized.includes('cửa hàng chỉ nhận đơn') ||
    normalized.includes('cua hang chi nhan don') ||
    normalized.includes('8h đến 22h') ||
    normalized.includes('8h den 22h') ||
    normalized.includes('8:00 - 22:00')
  ) {
    return STORE_HOURS_ERROR_MESSAGE
  }

  return message
}

export default function CartPage() {
  const [isLoadingCart, setIsLoadingCart] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)
  const [wards, setWards] = useState<WardResponse[]>([])
  const [selectedWardId, setSelectedWardId] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState({ fullName: '', phone: '' })
  const [addressDetail, setAddressDetail] = useState('')
  const [note, setNote] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherInputCode, setVoucherInputCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    phone: '',
    ward: '',
    addressDetail: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'cash'>('vnpay')
  const [rawCartItems, setRawCartItems] = useState<CartItemResponse[]>([])
  const [vouchers, setVouchers] = useState<UserVoucherResponse[]>([])
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('')
  const [isVoucherPanelOpen, setIsVoucherPanelOpen] = useState(false)
  const [flashSaleEligibleState, setFlashSaleEligibleState] = useState<boolean | undefined>(
    undefined
  )
  const [minOrderAmountState, setMinOrderAmountState] = useState<number>(0)
  const [flashSaleWarningMessageState, setFlashSaleWarningMessageState] = useState('')
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const { items, subtotal, shippingFee, discount, total, setCartFromServer, setShippingFee, clearCart } =
    useCartStore()

  const userFullName = ((user as any)?.name || (user as any)?.fullName || '').trim()
  const userPhone = String((user as any)?.phone || (user as any)?.phoneNumber || '').trim()
  const checkoutButtonLabel = paymentMethod === 'cash' ? 'Đặt hàng' : 'Thanh toán ngay'
  const selectedWard = wards.find((ward) => String(ward.wardId) === selectedWardId)
  const paymentMethodLabel =
    paymentMethod === 'vnpay' ? 'VNPay' : paymentMethod === 'momo' ? 'Ví điện tử' : 'Tiền mặt'
  const storeOpenNow = isStoreOpenNow()

  const now = Date.now()
  const selectedVoucher = useMemo(
    () => vouchers.find((voucher) => String(voucher.voucherId) === selectedVoucherId),
    [vouchers, selectedVoucherId]
  )
  const normalizedVoucherInput = voucherInputCode.trim().toUpperCase()

  const getVoucherDisabledReason = (voucher: UserVoucherResponse): string | null => {
    const startTime = new Date(voucher.startDate).getTime()
    const endTime = new Date(voucher.endDate).getTime()
    const minVoucherOrder = Number(voucher.minOrderAmount || 0)

    if (Number.isFinite(startTime) && startTime > now) {
      return 'Voucher chưa tới thời gian áp dụng'
    }

    if (Number.isFinite(endTime) && endTime < now) {
      return 'Voucher đã hết hạn'
    }

    if (minVoucherOrder > 0 && subtotal < minVoucherOrder) {
      return `Cần tối thiểu ${formatPrice(minVoucherOrder)}`
    }

    return null
  }

  const getVoucherBenefitText = (voucher: UserVoucherResponse): string => {
    const discountType = String(voucher.discountType || '').trim().toUpperCase()
    const discountValue = Number(voucher.discountValue || 0)
    const minOrder = Number(voucher.minOrderAmount || 0)
    const maxDiscount = Number(voucher.maxDiscount || 0)

    let benefitText = ''
    if (['PERCENT', 'PERCENTAGE', 'PERCENTAGE_DISCOUNT'].includes(discountType)) {
      benefitText = `Giảm ${discountValue}% cho đơn từ ${formatPrice(minOrder)}.`
      if (maxDiscount > 0) {
        benefitText += `\nGiảm tối đa ${formatPrice(maxDiscount)}.`
      }
      return benefitText
    }

    benefitText = `Giảm ${formatPrice(discountValue)} cho đơn từ ${formatPrice(minOrder)}.`
    if (maxDiscount > 0) {
      benefitText += `\nGiảm tối đa ${formatPrice(maxDiscount)}.`
    }
    return benefitText
  }

  const appliedVoucherDiscount = useMemo(() => {
    if (!selectedVoucher) {
      return 0
    }

    if (getVoucherDisabledReason(selectedVoucher)) {
      return 0
    }

    const discountValue = Number(selectedVoucher.discountValue || 0)
    const maxDiscount = Number(selectedVoucher.maxDiscount || 0)
    const discountType = String(selectedVoucher.discountType || '').trim().toUpperCase()
    const isPercentDiscount = ['PERCENT', 'PERCENTAGE', 'PERCENTAGE_DISCOUNT'].includes(discountType)
    const isFixedDiscount = ['FIXED', 'FIXED_AMOUNT', 'AMOUNT'].includes(discountType)
    const isFreeShippingDiscount = ['FREE_SHIPPING', 'SHIPPING'].includes(discountType)

    let calculatedDiscount = 0
    if (isPercentDiscount) {
      calculatedDiscount = subtotal * (discountValue / 100)
      if (maxDiscount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, maxDiscount)
      }
      calculatedDiscount = Math.min(calculatedDiscount, subtotal)
    } else if (isFreeShippingDiscount) {
      calculatedDiscount = shippingFee
    } else if (isFixedDiscount || discountType.length > 0) {
      calculatedDiscount = Math.min(discountValue, subtotal)
    }

    return Math.max(0, Math.round(calculatedDiscount))
  }, [selectedVoucher, subtotal, shippingFee, now])

  const effectiveDiscount = appliedVoucherDiscount > 0 ? appliedVoucherDiscount : discount
  const payableTotal = Math.max(subtotal + shippingFee - effectiveDiscount, 0)

  // Flash sale eligibility check from CartResponse root fields
  const flashSaleEligible = flashSaleEligibleState ?? true
  const minOrderAmount = minOrderAmountState
  const flashSaleWarningMessage = flashSaleWarningMessageState
  const hasFlashSaleItems = rawCartItems.some(
    (item) =>
      item.isFlashSaleApplied === true ||
      item.flashSaleApplied === true ||
      (typeof item.salePrice === 'number' && item.salePrice > 0)
  )
  const isBelowMinOrderForFlashSale =
    hasFlashSaleItems && minOrderAmount > 0 && subtotal < minOrderAmount
  const missingAmount = Math.max(minOrderAmount - subtotal, 0)
  const missingAmountInK = Math.ceil(missingAmount / 1000)
  const minimumOrderWarning =
    isBelowMinOrderForFlashSale || (!flashSaleEligible && minOrderAmount > 0)
      ? `Mua thêm ${missingAmountInK}k để mở khóa ưu đãi Flash Sale🔥.`
      : ''
  const subtotalWithoutFlashSale = items.reduce((sum, item) => {
    const unitPrice = item.unitPrice ?? item.product.minPrice
    return sum + unitPrice * item.quantity
  }, 0)
  const totalWithoutFlashSale = Math.max(subtotalWithoutFlashSale + shippingFee - effectiveDiscount, 0)
  const flashSaleSavings = Math.max(totalWithoutFlashSale - payableTotal, 0)
  const hasVisibleFlashSaleSavings = flashSaleSavings > 0
  const filteredVoucherSuggestions = useMemo(() => {
    const ranked = vouchers
      .map((voucher) => {
        const disabledReason = getVoucherDisabledReason(voucher)
        return { voucher, disabledReason }
      })
      .sort((a, b) => {
        if (!a.disabledReason && b.disabledReason) return -1
        if (a.disabledReason && !b.disabledReason) return 1
        return 0
      })

    if (!normalizedVoucherInput) {
      return ranked.slice(0, 6)
    }

    return ranked
      .filter(({ voucher }) => {
        const code = voucher.code.toUpperCase()
        const title = voucher.title.toUpperCase()
        return code.includes(normalizedVoucherInput) || title.includes(normalizedVoucherInput)
      })
      .slice(0, 6)
  }, [vouchers, normalizedVoucherInput, subtotal, now])

  useEffect(() => {
    setDeliveryInfo((prev) => ({
      fullName: prev.fullName || userFullName,
      phone: prev.phone || userPhone,
    }))
  }, [userFullName, userPhone])

  useEffect(() => {
    const fetchCart = async () => {
      if (!accessToken) {
        setRawCartItems([])
        setFlashSaleEligibleState(undefined)
        setMinOrderAmountState(0)
        setFlashSaleWarningMessageState('')
        setIsLoadingCart(false)
        return
      }

      try {
        const cart = await getCartApi(accessToken)
        setRawCartItems(cart.items || [])
        setFlashSaleEligibleState(cart.flashSaleEligible)
        setMinOrderAmountState(Number(cart.minOrderAmount || 0))
        setFlashSaleWarningMessageState(cart.flashSaleMessage || '')
        const mappedItems = (cart.items || []).map(mapServerItemToStoreItem)
        setCartFromServer(mappedItems, Number(cart.totalAmount || 0))
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Khong the tai gio hang')
      } finally {
        setIsLoadingCart(false)
      }
    }

    fetchCart()
  }, [accessToken, setCartFromServer])

  useEffect(() => {
    const fetchWards = async () => {
      setIsLoadingWards(true)
      try {
        const data = await getAllWardDeliveryApi()
        setWards(data)

        if (data.length > 0) {
          setSelectedWardId(String(data[0].wardId))
          setShippingFee(Number(data[0].shippingFee || 0))
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Khong the tai danh sach phuong xa')
      } finally {
        setIsLoadingWards(false)
      }
    }

    fetchWards()
  }, [setShippingFee])

  useEffect(() => {
    const fetchVouchers = async () => {
      if (!accessToken) {
        setVouchers([])
        setSelectedVoucherId('')
        setVoucherCode('')
        setVoucherInputCode('')
        return
      }

      setIsLoadingVouchers(true)
      try {
        const data = await getMyVouchersApi()
        setVouchers(data || [])
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Không thể tải voucher')
      } finally {
        setIsLoadingVouchers(false)
      }
    }

    fetchVouchers()
  }, [accessToken])

  useEffect(() => {
    if (!selectedVoucherId) {
      return
    }

    const selected = vouchers.find((voucher) => String(voucher.voucherId) === selectedVoucherId)
    if (!selected) {
      setSelectedVoucherId('')
      setVoucherCode('')
      setVoucherInputCode('')
      return
    }

    if (getVoucherDisabledReason(selected)) {
      setSelectedVoucherId('')
      setVoucherCode('')
      setVoucherInputCode('')
    }
  }, [vouchers, selectedVoucherId, subtotal])

  const applyVoucher = (voucher: UserVoucherResponse) => {
    const disabledReason = getVoucherDisabledReason(voucher)
    if (disabledReason) {
      toast.info(disabledReason)
      return false
    }

    setSelectedVoucherId(String(voucher.voucherId))
    setVoucherCode(voucher.code)
    setVoucherInputCode(voucher.code)
    toast.success(`Đã áp dụng voucher ${voucher.code}`)
    return true
  }

  const handleApplyVoucher = () => {
    const normalizedInput = normalizedVoucherInput
    const fromInput = normalizedInput
      ? vouchers.find((voucher) => voucher.code.trim().toUpperCase() === normalizedInput)
      : undefined
    const fromSelect = vouchers.find((voucher) => String(voucher.voucherId) === selectedVoucherId)
    const targetVoucher = fromInput || fromSelect

    if (!targetVoucher) {
      setSelectedVoucherId('')
      setVoucherCode('')
      toast.info('Mã voucher không hợp lệ!', { duration: 1500 })
      return
    }

    applyVoucher(targetVoucher)
  }

  const handlePickSuggestion = (voucher: UserVoucherResponse) => {
    setVoucherInputCode(voucher.code)
    setSelectedVoucherId(String(voucher.voucherId))
    setVoucherCode(voucher.code)
    setIsVoucherPanelOpen(false)
  }

  const handleClearVoucher = () => {
    setSelectedVoucherId('')
    setVoucherCode('')
    setVoucherInputCode('')
  }

  const handleWardChange = (wardId: string) => {
    setSelectedWardId(wardId)
    setFieldErrors((prev) => ({ ...prev, ward: '' }))
    const selectedWard = wards.find((ward) => String(ward.wardId) === wardId)

    if (!selectedWard) {
      return
    }

    setShippingFee(Number(selectedWard.shippingFee || 0))
  }

  const handleCheckout = () => {
    if (!storeOpenNow) {
      toast.error(STORE_HOURS_ERROR_MESSAGE)
      return
    }

    const nextErrors = {
      fullName: deliveryInfo.fullName.trim() ? '' : 'Mục này là bắt buộc',
      phone: deliveryInfo.phone.trim() ? '' : 'Mục này là bắt buộc',
      ward: selectedWardId ? '' : 'Mục này là bắt buộc',
      addressDetail: addressDetail.trim() ? '' : 'Mục này là bắt buộc',
    }

    setFieldErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setShowCheckoutConfirm(true)
  }

  const handleConfirmCheckout = async () => {
    if (isCheckingOut) {
      return
    }

    if (!storeOpenNow) {
      toast.error(STORE_HOURS_ERROR_MESSAGE)
      setShowCheckoutConfirm(false)
      return
    }

    if (!accessToken) {
      toast.error('Vui lòng đăng nhập')
      return
    }

    const mappedPaymentMethod: 'VNPAY' | 'MOMO' | 'CASH' =
      paymentMethod === 'vnpay'
        ? 'VNPAY'
        : paymentMethod === 'momo'
          ? 'MOMO'
          : 'CASH'

    try {
      setIsCheckingOut(true)
      setShowCheckoutConfirm(false)

      const orderResponse = await createOrderApi(
        {
          paymentMethod: mappedPaymentMethod,
          fullName: deliveryInfo.fullName.trim(),
          phone: deliveryInfo.phone.trim(),
          wardId: Number(selectedWardId),
          addressDetail: addressDetail.trim(),
          note: note.trim() || undefined,
          voucherCode: voucherCode.trim() || selectedVoucher?.code?.trim() || undefined,
        },
        accessToken
      )

      if (orderResponse.paymentUrl) {
        toast.success('Đang chuyển hướng đến cổng thanh toán VNPay...')
        window.location.href = orderResponse.paymentUrl
        return
      }

      clearCart()
      setSelectedVoucherId('')
      setVoucherCode('')
      setVoucherInputCode('')
      toast.success(orderResponse.message || 'Dat hang thanh cong')
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Khong the dat hang'
      toast.error(normalizeStoreHoursError(message))
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!accessToken) {
      toast.error('Vui lòng đăng nhập')
      return
    }

    setIsUpdating(true)
    try {
      const updatedCart = await updateCartItemQuantityApi(itemId, newQuantity, accessToken)
      setRawCartItems(updatedCart.items || [])
      setFlashSaleEligibleState(updatedCart.flashSaleEligible)
      setMinOrderAmountState(Number(updatedCart.minOrderAmount || 0))
      setFlashSaleWarningMessageState(updatedCart.flashSaleMessage || '')
      const mappedItems = (updatedCart.items || []).map(mapServerItemToStoreItem)
      setCartFromServer(mappedItems, Number(updatedCart.totalAmount || 0))
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Khong the cap nhat')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!accessToken) {
      toast.error('Vui lòng đăng nhập')
      return
    }

    setIsUpdating(true)
    try {
      const updatedCart = await deleteCartItemApi(itemId, accessToken)
      setRawCartItems(updatedCart.items || [])
      setFlashSaleEligibleState(updatedCart.flashSaleEligible)
      setMinOrderAmountState(Number(updatedCart.minOrderAmount || 0))
      setFlashSaleWarningMessageState(updatedCart.flashSaleMessage || '')
      const mappedItems = (updatedCart.items || []).map(mapServerItemToStoreItem)
      setCartFromServer(mappedItems, Number(updatedCart.totalAmount || 0))
      toast.success('Đã xóa khỏi giỏ hàng', { duration: 1000 })
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Khong the xoa')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoadingCart) {
    return (
      <div className="container-page py-16 text-center text-secondary-600">
        Đang tải giỏ hàng...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="text-2xl font-bold text-secondary-900 mb-1">
          Giỏ hàng trống
        </h2>
        <p className="text-secondary-500 mb-6">Hãy thêm món ăn yêu thích vào giỏ hàng</p>
        <Link href="/menu" className="btn-primary btn-lg inline-flex">
          Khám phá thực đơn
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-secondary-500 mb-6">
        <Link href="/">Trang chủ</Link>
        <span className="mx-2">›</span>
        <span className="text-secondary-900 font-medium">Giỏ hàng & Thanh toán</span>
      </nav>

      <h1 className="text-3xl font-bold text-secondary-900 mb-1 pb-4">
        Xác Nhận Đơn Hàng
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Cart Items + Address + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <div className="card p-6">
            <h2 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              Món ăn đã chọn
            </h2>
            <div className="space-y-4">
              {items.map((item) => {
                const unitPrice = item.unitPrice ?? item.product.minPrice
                const normalizedSaleQuantity =
                  typeof item.saleQuantity === 'number' && item.saleQuantity > 0
                    ? item.saleQuantity
                    : item.isFlashSaleApplied
                      ? 1
                      : 0
                const hasFlashSaleApplied =
                  item.isFlashSaleApplied === true &&
                  typeof item.salePrice === 'number' &&
                  item.salePrice > 0 &&
                  item.quantity > 0
                const saleQuantity = hasFlashSaleApplied
                  ? Math.min(normalizedSaleQuantity, item.quantity)
                  : 0
                const regularQuantity = Math.max(item.quantity - saleQuantity, 0)
                const saleSubtotal = hasFlashSaleApplied
                  ? (item.salePrice ?? 0) * saleQuantity
                  : 0
                const regularSubtotal = regularQuantity * unitPrice

                return (
                  <div key={item.id} className="pb-4 border-b border-border last:border-0 last:pb-0 space-y-3">
                    {hasFlashSaleApplied && saleQuantity > 0 && (
                      <div className="flex gap-4 rounded-xl border border-border bg-secondary-50/40 p-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary-100 shrink-0">
                          <img
                            src={item.product.images?.[0] || '/images/pizza.png'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-secondary-900 text-sm">{item.product.name}</p>
                          {item.size && (
                            <p className="text-xs text-secondary-500">Size: {item.size.name}</p>
                          )}
                          {item.toppings.length > 0 && (
                            <p className="text-xs text-secondary-500">
                              Topping: {item.toppings.map((t) => t.name).join(', ')}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                disabled
                                className="w-6 h-6 rounded-full border border-border flex items-center justify-center opacity-50 cursor-not-allowed"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-semibold w-5 text-center">{saleQuantity}</span>
                              <button
                                disabled
                                className="w-6 h-6 rounded-full border border-border flex items-center justify-center opacity-50 cursor-not-allowed"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-primary text-sm">{formatPrice(saleSubtotal)}</span>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isUpdating}
                                className="text-secondary-400 hover:text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(!hasFlashSaleApplied || regularQuantity > 0) && (
                      <div className="flex gap-4 rounded-xl border border-border bg-white p-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary-100 shrink-0">
                          <img
                            src={item.product.images?.[0] || '/images/pizza.png'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-secondary-900 text-sm">{item.product.name}</p>
                          {item.size && (
                            <p className="text-xs text-secondary-500">Size: {item.size.name}</p>
                          )}
                          {item.toppings.length > 0 && (
                            <p className="text-xs text-secondary-500">
                              Topping: {item.toppings.map((t) => t.name).join(', ')}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={isUpdating}
                                className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-semibold w-5 text-center">
                                {hasFlashSaleApplied ? regularQuantity : item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdating}
                                className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-primary text-sm">
                                {formatPrice(hasFlashSaleApplied ? regularSubtotal : item.subtotal)}
                              </span>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isUpdating}
                                className="text-secondary-400 hover:text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card p-6">
            <h2 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              📍 Địa chỉ giao hàng
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-secondary-600 mb-1">
                  Họ và tên <span className="text-error">*</span>
                </label>
                <input
                  className={`input ${fieldErrors.fullName ? 'border-error' : ''}`}
                  placeholder="Nguyễn Văn A"
                  value={deliveryInfo.fullName}
                  onChange={(event) => {
                    setDeliveryInfo((prev) => ({ ...prev, fullName: event.target.value }))
                    setFieldErrors((prev) => ({ ...prev, fullName: '' }))
                  }}
                />
                {fieldErrors.fullName && (
                  <p className="text-error text-xs mt-1">{fieldErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-secondary-600 mb-1">
                  Số điện thoại <span className="text-error">*</span>
                </label>
                <input
                  className={`input ${fieldErrors.phone ? 'border-error' : ''}`}
                  placeholder="0901234567"
                  value={deliveryInfo.phone}
                  onChange={(event) => {
                    setDeliveryInfo((prev) => ({ ...prev, phone: event.target.value }))
                    setFieldErrors((prev) => ({ ...prev, phone: '' }))
                  }}
                />
                {fieldErrors.phone && (
                  <p className="text-error text-xs mt-1">{fieldErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-secondary-600 mb-1">
                  Phường/Xã <span className="text-error">*</span>
                </label>
                <select
                  className={`input ${fieldErrors.ward ? 'border-error' : ''}`}
                  value={selectedWardId}
                  onChange={(event) => handleWardChange(event.target.value)}
                  disabled={isLoadingWards || wards.length === 0}
                >
                  <option value="">
                    {isLoadingWards ? 'Dang tai phuong/xa...' : 'Chọn phường/xã...'}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.wardId} value={String(ward.wardId)}>
                      {ward.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.ward && (
                  <p className="text-error text-xs mt-1">{fieldErrors.ward}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-secondary-600 mb-1">
                  Địa chỉ cụ thể <span className="text-error">*</span>
                </label>
                <input
                  className={`input ${fieldErrors.addressDetail ? 'border-error' : ''}`}
                  placeholder="Số nhà, đường ABC..."
                  value={addressDetail}
                  onChange={(event) => {
                    setAddressDetail(event.target.value)
                    setFieldErrors((prev) => ({ ...prev, addressDetail: '' }))
                  }}
                />
                {fieldErrors.addressDetail && (
                  <p className="text-error text-xs mt-1">{fieldErrors.addressDetail}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-secondary-600 mb-1">Ghi chú</label>
                <textarea
                  className="input resize-none h-20"
                  placeholder="Ghi chú cho tài xế và của hàng..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h2 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              💳 Phương thức thanh toán
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'vnpay', label: 'VNPay', icon: '💳' },
                { id: 'momo', label: 'Ví điện tử', icon: '📱' },
                { id: 'cash', label: 'Tiền mặt', icon: '💵' },
              ].map((method) => (
                <label
                  key={method.id}
                  className="flex items-center gap-2 p-3 border border-border rounded-xl cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-50"
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id as 'vnpay' | 'momo' | 'cash')}
                    className="accent-primary"
                  />
                  <span className="text-base">{method.icon}</span>
                  <span className="text-sm font-medium">{method.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-semibold text-secondary-900 mb-4">Mã giảm giá</h2>
            <div className="space-y-3 mb-6">
              <div className="relative">
                <label className="block text-xs text-secondary-500 mb-1">Nhập hoặc chọn mã voucher</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    className="input w-full pl-9 pr-3 text-sm border-secondary-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Nhập mã, ví dụ: FOOD"
                    value={voucherInputCode}
                    onFocus={() => setIsVoucherPanelOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setIsVoucherPanelOpen(false), 120)
                    }}
                    onChange={(event) => {
                      setVoucherInputCode(event.target.value.toUpperCase())
                      setSelectedVoucherId('')
                      setIsVoucherPanelOpen(true)
                    }}
                  />
                  </div>
                  <button type="button" className="btn-primary btn-md shrink-0" onClick={handleApplyVoucher}>
                    Áp dụng
                  </button>
                </div>
                {isVoucherPanelOpen && !isLoadingVouchers && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-white shadow-lg overflow-hidden">
                    <div className="max-h-56 overflow-auto p-2 space-y-1">
                      {filteredVoucherSuggestions.length === 0 ? (
                        <p className="text-xs text-secondary-500 px-2 py-2">Không tìm thấy voucher phù hợp</p>
                      ) : (
                        filteredVoucherSuggestions.map(({ voucher, disabledReason }) => {
                          const isActive = selectedVoucherId === String(voucher.voucherId)

                          return (
                            <button
                              key={`suggest-${voucher.voucherId}`}
                              type="button"
                              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                isActive
                                  ? 'border-primary/50 bg-primary/5 shadow-sm'
                                  : 'border-secondary-300 bg-white hover:border-secondary-500 hover:bg-secondary-50'
                              } ${disabledReason ? 'opacity-60' : ''}`}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handlePickSuggestion(voucher)}
                            >
                              <p className="text-xs font-semibold text-secondary-900">{voucher.code}</p>
                              <p className="text-[11px] text-secondary-700 mt-0.5">{voucher.title}</p>
                              <p className="text-[11px] text-secondary-500 mt-0.5 whitespace-pre-line">{getVoucherBenefitText(voucher)}</p>
                              {disabledReason && (
                                <p className="text-[11px] text-error mt-1">{disabledReason}</p>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
                {isLoadingVouchers && (
                  <p className="text-xs text-secondary-500 mt-2">Đang tải voucher...</p>
                )}
              </div>

              {voucherCode && (
                <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                  <p className="text-xs text-success font-medium">Đang áp dụng: {voucherCode}</p>
                  <button type="button" onClick={handleClearVoucher} className="text-xs text-secondary-500 hover:text-secondary-700">
                    Bỏ chọn
                  </button>
                </div>
              )}

            </div>

            <h2 className="font-semibold text-secondary-900 mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-secondary-600">
                <span>Tạm tính ({items.length} món)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {minimumOrderWarning && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs leading-relaxed">
                  <p className="font-medium mb-1">⚠️ Thông báo giảm giá</p>
                  <p>{minimumOrderWarning}</p>
                </div>
              )}
              <div className="flex justify-between text-secondary-600">
                <span>Phí giao hàng</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              {effectiveDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Giảm giá {voucherCode ? `(${voucherCode})` : ''}</span>
                  <span>-{formatPrice(effectiveDiscount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-between font-bold text-base">
                <span>Tổng thanh toán</span>
                <div className="text-right">
                  <span className="text-primary text-lg block">{formatPrice(payableTotal)}</span>
                  {hasVisibleFlashSaleSavings && (
                    <span className="text-secondary-500 text-xs line-through">
                      {formatPrice(totalWithoutFlashSale)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || !storeOpenNow}
              className="btn-primary btn-lg w-full mt-6 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? 'Dang xu ly...' : checkoutButtonLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
            {!storeOpenNow && (
              <p className="mt-3 text-xs text-rose-600 text-center">
                {STORE_HOURS_ERROR_MESSAGE}
              </p>
            )}
          </div>
        </div>
      </div>
      </div>

      {showCheckoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-primary-50">
              <h3 className="text-lg font-bold text-secondary-900">Xác nhận đặt hàng</h3>
              <p className="text-sm text-secondary-600 mt-1">
                Vui lòng kiểm tra thông tin trước khi đặt hàng.
              </p>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-secondary-500">Người nhận</span>
                <span className="col-span-2 font-medium text-secondary-900 break-words">
                  {deliveryInfo.fullName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-secondary-500">Số điện thoại</span>
                <span className="col-span-2 font-medium text-secondary-900 break-words">
                  {deliveryInfo.phone}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-secondary-500">Khu vực</span>
                <span className="col-span-2 font-medium text-secondary-900 break-words">
                  {selectedWard?.name || '--'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-secondary-500">Địa chỉ</span>
                <span className="col-span-2 font-medium text-secondary-900 break-words">
                  {addressDetail}
                </span>
              </div>
              {note.trim() && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-secondary-500">Ghi chú</span>
                  <span className="col-span-2 text-secondary-700 break-words">{note}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-secondary-500">Thanh toán</span>
                <span className="col-span-2 font-medium text-secondary-900">{paymentMethodLabel}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-secondary-500">Tổng tiền</span>
                <span className="col-span-2 text-lg font-bold text-primary">{formatPrice(payableTotal)}</span>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border bg-secondary-50 flex gap-3 justify-end">
              <button
                type="button"
                className="btn-outline btn-md"
                onClick={() => {
                  setShowCheckoutConfirm(false)
                  toast.info('Bạn đã hủy đặt hàng')
                }}
                disabled={isCheckingOut}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary btn-md"
                onClick={handleConfirmCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Dang xu ly...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
