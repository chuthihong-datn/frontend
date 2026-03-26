'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { addToCartApi } from '@/api/cart'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import type { ProductDetail, ProductSize } from '@/types'

interface MenuDetailClientProps {
  product: ProductDetail
}

export default function MenuDetailClient({ product }: MenuDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(
    product.sizes?.[0] || null
  )
  const [selectedToppings, setSelectedToppings] = useState<number[]>([])
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const { addItem } = useCartStore()
  const accessToken = useAuthStore((state) => state.accessToken)

  // Calculate total price
  const totalPrice = useMemo(() => {
    let price = product.minPrice
    if (selectedSize) {
      price += selectedSize.extraPrice
    }
    selectedToppings.forEach((toppingId) => {
      const topping = product.toppings?.find((t) => t.id === toppingId)
      if (topping) {
        price += topping.price
      }
    })
    return price * quantity
  }, [product.minPrice, product.toppings, selectedSize, selectedToppings, quantity])

  const handleAddToCart = async () => {
    if (!accessToken) {
      toast.error('Vui lòng đăng nhập để thêm món vào giỏ hàng')
      return
    }

    setIsAdding(true)
    try {
      const selectedToppingsList = product.toppings?.filter((t) =>
        selectedToppings.includes(t.id)
      ) || []

      await addToCartApi(
        {
          menuId: product.id,
          menuSizeId: selectedSize?.id ?? null,
          quantity,
          toppingIds: selectedToppings,
        },
        accessToken
      )

      addItem(product, quantity, selectedSize || undefined, selectedToppingsList)

      toast.success(`Đã thêm ${product.name} vào giỏ hàng!`, { duration: 1500 })

      // Reset after adding
      setQuantity(1)
      setSelectedToppings([])
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể thêm vào giỏ hàng')
    } finally {
      setIsAdding(false)
    }
  }

  const toggleTopping = (toppingId: number) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId) ? prev.filter((id) => id !== toppingId) : [...prev, toppingId]
    )
  }

  return (
    <div className="flex flex-col">
      {/* Product Name & Price */}
      <h1
        className="text-4xl font-bold text-secondary-900 mb-3 overflow-hidden"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '1.2em',
          lineHeight: 1.2,
        }}
      >
        {product.name}
      </h1>
      <p className="text-3xl font-bold text-primary mb-6">
        {Math.ceil(product.minPrice).toLocaleString('vi-VN')}đ
      </p>

      {/* Description */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-secondary-900 mb-2">Mô tả món ăn</h3>
        <p
          className="text-secondary-600 overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '1.5em',
            lineHeight: 1.5,
          }}
        >
          {product.description}
        </p>
      </div>

      {/* Size Selection */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-secondary-900 uppercase tracking-wider mb-3">
            Kích cỡ
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {product.sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size)}
                className={`py-2 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  selectedSize?.id === size.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-secondary-200 hover:border-primary/50 text-secondary-900'
                }`}
              >
                {size.name}
                    {size.extraPrice > 0 && (
                    <span className="block text-xs mt-0.5">
                        +{size.extraPrice.toLocaleString('vi-VN')}đ
                    </span>
                    )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toppings Selection */}
      {product.toppings && product.toppings.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-bold text-secondary-900 uppercase tracking-wider mb-3">
            Thêm Toppings
          </h3>
          <div className="space-y-2">
            {product.toppings.map((topping) => (
              <label
                key={topping.id}
                className="flex items-center justify-between p-3 rounded-lg border border-secondary-200 cursor-pointer hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedToppings.includes(topping.id)}
                    onChange={() => toggleTopping(topping.id)}
                    className="w-5 h-5 rounded text-primary accent-primary"
                  />
                  <span className="font-medium text-secondary-900">{topping.name}</span>
                </div>
                <span className="text-primary font-bold">+{topping.price.toLocaleString('vi-VN')}đ</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="flex items-center gap-4 pt-6 border-t border-secondary-200">
        <div className="flex items-center border-2 border-secondary-200 rounded-lg bg-white">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-3 text-primary hover:bg-secondary-50 transition-colors"
          >
            <Minus size={20} />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 text-center font-bold text-lg border-none bg-transparent focus:outline-none"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-3 text-primary hover:bg-secondary-50 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-75 shadow-lg shadow-primary/20"
        >
          <ShoppingCart size={20} />
          Thêm vào giỏ hàng
        </button>
      </div>

      {/* Price Summary */}
      <div className="mt-4 pt-4 border-t border-secondary-200">
        <div className="flex items-center justify-between">
          <span className="text-secondary-600">Tổng tiền:</span>
          <span className="text-2xl font-bold text-primary">
            {Math.ceil(totalPrice).toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>
    </div>
  )
}
