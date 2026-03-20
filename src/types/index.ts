// ============================================================
// PRODUCT / MENU
// ============================================================
export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  image?: string
}

export interface Topping {
  id: string
  name: string
  price: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: Category
  rating: number
  reviewCount: number
  toppings?: Topping[]
  sizes?: ProductSize[]
  isAvailable: boolean
  isFeatured?: boolean
  badge?: 'new' | 'sale' | 'hot'
  discount?: number
  createdAt: string
  updatedAt: string
}

export interface ProductSize {
  id: string
  label: string
  value: 'S' | 'M' | 'L' | 'XL'
  priceModifier: number
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
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
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

// ============================================================
// USER / AUTH
// ============================================================
export type UserRole = 'customer' | 'admin'
export type PaymentMethod = 'vnpay' | 'momo' | 'cash'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: UserRole
  createdAt: string
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: number
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
