'use client'

import { Minus, Plus, Trash2, Tag, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { items, subtotal, shippingFee, discount, total, updateQuantity, removeItem } =
    useCartStore()

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="font-display text-2xl font-bold text-secondary-900 mb-2">
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
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-secondary-500 mb-6">
        <Link href="/">Trang chủ</Link>
        <span className="mx-2">›</span>
        <span className="text-secondary-900 font-medium">Giỏ hàng & Thanh toán</span>
      </nav>

      <h1 className="font-display text-3xl font-bold text-secondary-900 mb-8">
        Xác Nhận Đơn Hàng
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Cart Items + Address + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <div className="card p-6">
            <h2 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              🛒 Món ăn đã chọn
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary-100 shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary-900 text-sm">{item.product.name}</p>
                    {item.size && (
                      <p className="text-xs text-secondary-500">Size: {item.size.label}</p>
                    )}
                    {item.toppings.length > 0 && (
                      <p className="text-xs text-secondary-500">
                        Topping: {item.toppings.map((t) => t.name).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary text-sm">{formatPrice(item.subtotal)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-secondary-400 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card p-6">
            <h2 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              📍 Địa chỉ giao hàng
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-secondary-600 mb-1">Họ và tên</label>
                <input className="input" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm text-secondary-600 mb-1">Số điện thoại</label>
                <input className="input" placeholder="0901234567" />
              </div>
              <div>
                <label className="block text-sm text-secondary-600 mb-1">Phường/Xã</label>
                <select className="input">
                  <option>Chọn phường/xã...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-secondary-600 mb-1">Địa chỉ cụ thể</label>
                <input className="input" placeholder="Số nhà, đường ABC..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-secondary-600 mb-1">Ghi chú</label>
                <textarea className="input resize-none h-20" placeholder="Ghi chú cho tài xế và của hàng..." />
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
                  <input type="radio" name="payment" value={method.id} className="accent-primary" />
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
              <input className="input flex-1 text-sm" placeholder="FOODIESS" />
              <button className="btn-primary btn-md shrink-0">Áp dụng</button>
            </div>

            <h2 className="font-semibold text-secondary-900 mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-secondary-600">
                <span>Tạm tính ({items.length} món)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
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
                <span className="text-primary text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            <button className="btn-primary btn-lg w-full mt-6 flex items-center justify-center gap-2">
              Thanh toán ngay
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
