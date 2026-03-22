'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import type { ProductDetail, ProductSize, Topping } from '@/types'

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
    setIsAdding(true)
    try {
      const selectedToppingsList = product.toppings?.filter((t) =>
        selectedToppings.includes(t.id)
      ) || []

      addItem(product, quantity, selectedSize || undefined, selectedToppingsList)

      toast.success(`Đã thêm ${product.name} vào giỏ hàng!`)

      // Reset after adding
      setQuantity(1)
      setSelectedToppings([])
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
      {/* Badge & Rating */}
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase">
          Bán chạy
        </span>
        <div className="flex items-center gap-1 text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-secondary-300'}>
              ★
            </span>
          ))}
          <span className="text-sm font-bold text-secondary-900 ml-1">{product.rating}</span>
          <span className="text-sm text-secondary-500">({product.reviewCount}+ đánh giá)</span>
        </div>
      </div>

      {/* Product Name & Price */}
      <h1
        className="text-4xl font-bold text-secondary-900 mb-3 overflow-hidden"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '2.4em',
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
            minHeight: '3em',
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
