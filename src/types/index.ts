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
  totalSold?: number
}

export interface ProductDetail {
  id: number
  name: string
  description: string
  images: string[]
  minPrice: number
  amount: number
  sizes: ProductSize[]
  toppings: Topping[]
  rating: number
  reviewCount: number
  reviews: Review[]
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
    reviews: item.reviews || []
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
  image: string
  menuName: string
  sizeName: string | null
  toppings: string[]
  quantity: number
  price: number
  itemTotal: number
}

export interface CartResponse {
  items: CartItemResponse[]
  totalAmount: number
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
