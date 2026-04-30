// ============================================================
// PRODUCT / MENU
// ============================================================
export interface Category {
  id: number
  name: string
  iconUrl: string
}

export interface Product {
  id: number
  name: string
  images: string[]
  rating: number
  minPrice: number
  discountedPrice?: number
  discountPercent?: number
  flashSale?: boolean
  flashSaleEndTime?: string
  totalSold?: number
  outOfStock?: boolean
}

export interface ProductDetail {
  id: number
  name: string
  description: string
  images: string[]
  minPrice: number
  discountedPrice?: number
  discountPercent?: number
  flashSale?: boolean
  flashSaleEndTime?: string
  saleQuantity?: number
  amount: number
  sizes: ProductSize[]
  toppings: Topping[]
  rating: number
  reviewCount: number
  reviews: Review[]
  outOfStock?: boolean
}

export interface ProductSize {
  id: number
  name: string
  extraPrice: number
}

export interface Topping {
  id: number
  name: string
  price: number
}

export interface Review {
  id: number
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export function mapToProductDetail(item: any): ProductDetail {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    images: item.images || [],
    minPrice: item.minPrice,
    amount: item.amount,
    sizes: item.sizes || [],
    toppings: item.toppings || [],
    rating: item.rating,
    reviewCount: item.reviewCount,
    reviews: item.reviews || [],
    outOfStock: item.outOfStock || false
  }
}

// ============================================================
// CART
// ============================================================
export interface CartItem {
  id: string
  product: Product
  quantity: number
  size?: ProductSize
  toppings: Topping[]
  note?: string
  unitPrice?: number
  salePrice?: number
  saleQuantity?: number
  isFlashSaleApplied?: boolean
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}
 export interface AddToCartRequestPayload {
  menuId: number
  menuSizeId?: number | null
  quantity: number
  toppingIds: number[]
}

export interface CartItemResponse {
  cartItemId: number
  menuId?: number
  image: string
  menuName: string
  sizeName: string | null
  toppings: string[]
  quantity: number
  price: number
  itemTotal: number
  isFlashSaleApplied?: boolean
  flashSaleApplied?: boolean
  saleQuantity?: number
  salePrice?: number
  flashSaleEligible?: boolean
  minOrderAmount?: number
  flashSaleMessage?: string
}

export interface CartResponse {
  items: CartItemResponse[]
  totalAmount: number
  flashSaleEligible?: boolean
  minOrderAmount?: number
  flashSaleMessage?: string
}

export interface WardResponse {
  wardId: number
  name: string
  isDelivery: boolean
  shippingFee: number
}

export type AdminWardResponse = {
  wardId: number | string
  wardCode: string
  name: string
  shippingFee: number
  isDelivery: boolean
  createdAt: string | null
  updatedAt: string | null
}

export type AdminWardRequest = {
  shippingFee: number
  isDelivery: boolean
}
// ============================================================
// ORDER
// ============================================================
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: string
  product: Product
  quantity: number
  size?: ProductSize
  toppings: Topping[]
  unitPrice: number
  subtotal: number
}

export interface DeliveryAddress {
  fullName: string
  phone: string
  province: string
  district: string
  ward: string
  addressDetail: string
  note?: string
}

export interface Order {
  id: string
  code: string
  user: User
  items: OrderItem[]
  deliveryAddress: DeliveryAddress
  paymentMethod: PaymentMethod
  voucherCode?: string
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  status: OrderStatus
  statusHistory: OrderStatusHistory[]
  createdAt: string
  updatedAt: string
}

export interface OrderStatusHistory {
  status: OrderStatus
  timestamp: string
  note?: string
}

type BackendPaymentMethod = 'VNPAY' | 'MOMO' | 'CASH'

export interface CreateOrderRequest {
  paymentMethod: BackendPaymentMethod
  fullName: string
  phone: string
  wardId: number
  addressDetail: string
  note?: string
  voucherCode?: string
}

export interface CreateOrderResponse {
  orderId: number
  paymentUrl?: string
  message?: string
}

export type AdminOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELLED'

export type AdminPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | string

export type AdminOrderItemResponse = {
  menuName: string
  sizeName: string | null
  toppings: string[]
  quantity: number
  itemTotal: number
}

export type AdminOrderResponse = {
  orderId: number | string
  customerName: string
  phone: string
  address: string
  wardName: string
  totalAmount: number
  shippingFee: number
  finalAmount: number
  orderStatus: AdminOrderStatus
  paymentStatus: AdminPaymentStatus
  createdAt: string
  items: AdminOrderItemResponse[]
}

export type UpdateAdminOrderStatusRequest = {
  orderStatus: AdminOrderStatus
}


// ============================================================
// VOUCHER
// ============================================================
export type VoucherType = 'percent' | 'fixed' | 'shipping'

export interface Voucher {
  id: string
  code: string
  title: string
  description: string
  type: VoucherType
  value: number
  minOrderAmount: number
  maxDiscount?: number
  expiresAt: string
  usageLimit?: number
  usedCount: number
  isActive: boolean
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | string

export interface UserVoucherResponse {
  voucherId: number | string
  code: string
  title: string
  description: string
  discountType: DiscountType
  discountValue: number
  maxDiscount?: number
  minOrderAmount: number
  startDate: string
  endDate: string
}

export interface AvailableVoucherResponse extends UserVoucherResponse {
  outOfStock: boolean
}

// ============================================================
// USER / AUTH
// ============================================================
export type UserRole = 'customer' | 'admin'
export type PaymentMethod = 'vnpay' | 'momo' | 'cash'

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  avtUrl?: string
  role: UserRole
  createdAt: string
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  id: number
  fullName: string
  token: string
  email: string
  phone: string
  avtUrl?: string
  role: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  phone: string
  password: string
}

export interface RegisterResponse {
  success: boolean
  message: string
}

export interface ProfileUpdateRequest {
  fullName?: string
  phone?: string
}

export interface ProfileResponse {
  accountId: number
  fullName: string
  email: string
  phone: string
  avtUrl: string
  createdAt: string
}

// ============================================================
// USER / ORDER
// ============================================================

export type UserOrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED' | string
export type UserPaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | string

export type OrderByUserItemResponse = {
  menuName: string
  sizeName: string | null
  toppings: string[]
  quantity: number
  itemTotal: number
}

export type OrderByUserResponse = {
  orderId: number | string
  address: string
  wardName: string
  totalAmount: number
  shippingFee: number
  finalAmount: number
  orderStatus: UserOrderStatus
  paymentStatus: UserPaymentStatus
  createdAt: string
  items: OrderByUserItemResponse[]
}

// ============================================================
// API RESPONSE
// ============================================================
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================
// FILTER / SORT
// ============================================================
export interface ProductFilter {
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  sort?: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating'
  page?: number
  limit?: number
}

// ============================================================
// ADMIN / CATEGORY
// ============================================================

export type AdminCategoryRequest = {
  name: string
  description: string
  isActive: boolean
}

export type AdminCategoryResponse = {
  categoryId: string | number
  name: string
  description: string
  iconUrl: string | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

// ============================================================
// ADMIN / ACCOUNT
// ============================================================

export type AdminAccountRole = 'ADMIN' | 'CUSTOMER' | string

export type AdminAccountRequest = {
  fullName: string
  role: AdminAccountRole
  avtUrl?: string
}

export type AdminAccountResponse = {
  accountId: string | number
  fullName: string
  email: string
  phone: string | null
  password?: string | null
  role: AdminAccountRole
  isActive: boolean
  avtUrl: string | null
  createdAt: string | null
  updatedAt: string | null
}

// ============================================================
// ADMIN / TOPPING
// ============================================================

export type AdminToppingRequest = {
  toppingId?: string | number
  name: string
  price: number
  isActive: boolean
  outOfStock: boolean
}

export type AdminToppingResponse = {
  toppingId: string | number
  name: string
  price: number
  isActive: boolean
  outOfStock: boolean
}

// ============================================================
// ADMIN / MENU
// ============================================================

export type AdminMenuSizeRequest = {
  sizeName: string
  extraPrice: number
}

export type AdminMenuRequest = {
  categoryId: string | number
  name: string
  description: string
  basePrice: number
  amount: number
  toppingIds: Array<string | number>
  sizes: AdminMenuSizeRequest[]
}

export type AdminMenuSizeResponse = {
  sizeName: string
  extraPrice: number
}

export type AdminMenuResponse = {
  menuId: string | number
  name: string
  description: string
  basePrice: number
  amount: number
  isActive: boolean
  outOfStock: boolean
  deleted: boolean
  images: string[]
  categoryName: string
  toppings: string[]
  sizes: AdminMenuSizeResponse[]
}

// ============================================================
// ADMIN / PROMOTIONS
// ============================================================

export type AdminPromotionDiscountType = 'PERCENT' | 'FIXED' | string

export type AdminVoucherRequest = {
  code: string
  title: string
  description: string
  discountType: AdminPromotionDiscountType
  discountValue: number
  maxDiscount?: number | null
  minOrderAmount?: number | null
  startDate: string
  endDate: string
  usageLimit?: number | null
  isActive: boolean
}

export type AdminVoucherResponse = {
  voucherId: string | number
  code: string
  title: string
  description: string
  discountType: AdminPromotionDiscountType
  discountValue: number
  maxDiscount?: number | null
  minOrderAmount?: number | null
  startDate: string
  endDate: string
  usageLimit?: number | null
  isActive: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export type AdminReviewResponse = {
  reviewId: string | number
  menuName: string
  userName: string
  rating: number
  comment: string
  createdAt: string
  isDeleted: boolean
}

export type AdminFlashSaleRequest = {
  title: string
  description: string
  discountType: AdminPromotionDiscountType
  discountValue: number
  maxDiscount?: number | null
  minOrderAmount?: number | null
  maxQuantityPerOrder?: number | null
  minStock?: number | null
  startTime: string
  endTime: string
  isActive: boolean
  menuIds: Array<string | number>
}

export type AdminFlashSaleItemRef = {
  menuId?: string | number
  id?: string | number
  name?: string
  menuName?: string
}

export type AdminFlashSaleResponse = {
  flashSaleId: string | number
  title: string
  description: string
  discountType: AdminPromotionDiscountType
  discountValue: number
  maxDiscount?: number | null
  minOrderAmount?: number | null
  maxQuantityPerOrder?: number | null
  minStock?: number | null
  startTime: string
  endTime: string
  isActive: boolean
  menuNames: string[]
  createdAt?: string | null
  updatedAt?: string | null
}

// ============================================================
// ADMIN / STATISTICS
// ============================================================

export type AdminDailyStatsResponse = {
  date: string
  revenue: number
  orderCount: number
}

export type AdminHourlyStatsResponse = {
  hour: number
  revenue: number
  orderCount: number
}

export type AdminMonthlyStatsResponse = {
  month: string | number
  year?: number
  revenue: number
  orderCount: number
}

export type AdminProductStatsResponse = {
  menuName: string
  quantity: number
}

export type AdminTodayMenuStatisticResponse = {
  menuId: string | number
  menuName: string
  totalQuantity: number
}

export type AdminFlashSaleSuggestionResponse = {
  type: string
  reason: string
  hour: number
  discount: number
  duration: string
}
