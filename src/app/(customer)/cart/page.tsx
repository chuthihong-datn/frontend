'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus, Trash2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getCartApi, updateCartItemQuantityApi, deleteCartItemApi } from '@/api/cart'
import { createOrderApi } from '@/api/order'
import { getAllWardDeliveryApi } from '@/api/ward'
import type { CartItemResponse, WardResponse } from '@/types'
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
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    phone: '',
    ward: '',
    addressDetail: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'cash'>('vnpay')
  const [rawCartItems, setRawCartItems] = useState<CartItemResponse[]>([])
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
  const totalWithoutFlashSale = subtotalWithoutFlashSale + shippingFee - discount
  const flashSaleSavings = Math.max(totalWithoutFlashSale - total, 0)
  const hasVisibleFlashSaleSavings = flashSaleSavings > 0

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
          voucherCode: voucherCode.trim() || undefined,
        },
        accessToken
      )

      if (orderResponse.paymentUrl) {
        toast.success('Dang chuyen den cong thanh toan VNPay...')
        window.location.href = orderResponse.paymentUrl
        return
      }

      clearCart()
      toast.success(orderResponse.message || 'Dat hang thanh cong')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Khong the dat hang')
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
            <div className="flex gap-2 mb-6">
              <input
                className="input flex-1 text-sm"
                placeholder="FOODIESS"
                value={voucherCode}
                onChange={(event) => setVoucherCode(event.target.value)}
              />
              <button
                type="button"
                className="btn-primary btn-md shrink-0"
                onClick={() => toast.info('Ma giam gia se duoc ap dung khi dat hang')}
              >
                Áp dụng
              </button>
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
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-between font-bold text-base">
                <span>Tổng thanh toán</span>
                <div className="text-right">
                  <span className="text-primary text-lg block">{formatPrice(total)}</span>
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
              disabled={isCheckingOut}
              className="btn-primary btn-lg w-full mt-6 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? 'Dang xu ly...' : checkoutButtonLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
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
                <span className="col-span-2 text-lg font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border bg-secondary-50 flex gap-3 justify-end">
              <button
                type="button"
                className="btn-outline btn-md"
                onClick={() => {
                  setShowCheckoutConfirm(false)
                  toast.info('Ban da huy dat hang')
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
