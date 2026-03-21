import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductSize, Topping } from '@/types'

interface CartState {
  items: CartItem[]
  itemCount: number
  subtotal: number
  shippingFee: number
  discount: number
  total: number

  addItem: (
    product: Product,
    quantity?: number,
    size?: ProductSize,
    toppings?: Topping[]
  ) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  applyVoucher: (discount: number) => void
}

function calcItemSubtotal(
  product: Product,
  quantity: number,
  size?: ProductSize,
  toppings: Topping[] = []
): number {
  const basePrice = product.minPrice
  const sizeModifier = size?.extraPrice ?? 0
  const toppingTotal = toppings.reduce((sum, t) => sum + t.price, 0)
  return (basePrice + sizeModifier + toppingTotal) * quantity
}

function calcTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  return { subtotal, itemCount }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,
      shippingFee: 15000,
      discount: 0,
      total: 0,

      addItem: (product, quantity = 1, size, toppings = []) => {
        const { items } = get()
        // Check if same item (same product, size, toppings) already exists
        const existingIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.size?.id === size?.id &&
            JSON.stringify(item.toppings.map((t) => t.id).sort()) ===
              JSON.stringify(toppings.map((t) => t.id).sort())
        )

        let newItems: CartItem[]
        if (existingIndex >= 0) {
          newItems = items.map((item, i) =>
            i === existingIndex
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  subtotal: calcItemSubtotal(product, item.quantity + quantity, size, toppings),
                }
              : item
          )
        } else {
          const newItem: CartItem = {
            id: `${product.id}-${size?.id ?? 'default'}-${Date.now()}`,
            product,
            quantity,
            size,
            toppings,
            subtotal: calcItemSubtotal(product, quantity, size, toppings),
          }
          newItems = [...items, newItem]
        }

        const { subtotal, itemCount } = calcTotals(newItems)
        const { shippingFee, discount } = get()
        set({
          items: newItems,
          subtotal,
          itemCount,
          total: subtotal + shippingFee - discount,
        })
      },

      removeItem: (itemId) => {
        const newItems = get().items.filter((item) => item.id !== itemId)
        const { subtotal, itemCount } = calcTotals(newItems)
        const { shippingFee, discount } = get()
        set({
          items: newItems,
          subtotal,
          itemCount,
          total: subtotal + shippingFee - discount,
        })
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        const newItems = get().items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                subtotal: calcItemSubtotal(item.product, quantity, item.size, item.toppings),
              }
            : item
        )
        const { subtotal, itemCount } = calcTotals(newItems)
        const { shippingFee, discount } = get()
        set({
          items: newItems,
          subtotal,
          itemCount,
          total: subtotal + shippingFee - discount,
        })
      },

      clearCart: () => {
        set({ items: [], itemCount: 0, subtotal: 0, discount: 0, total: 0 })
      },

      applyVoucher: (discount) => {
        const { subtotal, shippingFee } = get()
        set({ discount, total: subtotal + shippingFee - discount })
      },
    }),
    {
      name: 'foodie-cart',
    }
  )
)
