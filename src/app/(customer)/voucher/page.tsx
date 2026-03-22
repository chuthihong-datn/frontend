import type { Metadata } from 'next'
import { Clock, Tag } from 'lucide-react'

export const metadata: Metadata = { title: 'Voucher & Ưu Đãi' }

const VOUCHERS = [
  {
    id: '1',
    title: 'Giảm 50k cho đơn từ 500k',
    code: 'SHIP0VND',
    expiresAt: '20/03/2026',
    expiresIn: 'HẾT HẠN TRONG 3 GIỜ',
    type: 'fixed' as const,
    bgColor: 'bg-orange-50',
    borderColor: 'border-primary/20',
  },
  {
    id: '2',
    title: 'Giảm 50k cho đơn từ 500k',
    code: 'SHIP0VND',
    expiresAt: '20/03/2026',
    expiresIn: 'HẾT HẠN TRONG 3 GIỜ',
    type: 'fixed' as const,
    bgColor: 'bg-orange-50',
    borderColor: 'border-primary/20',
  },
  {
    id: '3',
    title: 'Giảm 50k cho đơn từ 500k',
    code: 'SHIP0VND',
    expiresAt: '20/03/2026',
    expiresIn: 'HẾT HẠN TRONG 3 GIỜ',
    type: 'fixed' as const,
    bgColor: 'bg-orange-50',
    borderColor: 'border-primary/20',
  },
  {
    id: '4',
    title: 'Free ship giảm tối đa 15k cho đơn từ 50k',
    code: 'SHIP0VND',
    expiresAt: '20/03/2026',
    expiresIn: 'HẾT HẠN TRONG 3 GIỜ',
    type: 'shipping' as const,
    bgColor: 'bg-green-50',
    borderColor: 'border-success/20',
  },
  {
    id: '5',
    title: 'Free ship giảm tối đa 15k cho đơn từ 50k',
    code: 'SHIP0VND',
    expiresAt: '20/03/2026',
    expiresIn: 'HẾT HẠN TRONG 3 GIỜ',
    type: 'shipping' as const,
    bgColor: 'bg-green-50',
    borderColor: 'border-success/20',
  },
  {
    id: '6',
    title: 'Free ship giảm tối đa 15k cho đơn từ 50k',
    code: 'SHIP0VND',
    expiresAt: '20/03/2026',
    expiresIn: 'HẾT HẠN TRONG 3 GIỜ',
    type: 'shipping' as const,
    bgColor: 'bg-green-50',
    borderColor: 'border-success/20',
  },
]

export default function VoucherPage() {
  return (
    <div className="container-page py-8">
      <nav className="text-sm text-secondary-500 mb-4">
        <span>Trang chủ</span>
        <span className="mx-2">›</span>
        <span className="text-secondary-900 font-medium">Kho Voucher & Ưu Đãi</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-1">
          Kho Voucher & Ưu Đãi
        </h1>
        <span className="flex items-center gap-2 text-sm text-secondary-600 bg-secondary-100 px-3 py-1.5 rounded-full">
          🎫 Đang có <strong>24 mã mới</strong>
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {VOUCHERS.map((voucher) => (
          <div
            key={voucher.id}
            className={`rounded-2xl border p-5 ${voucher.bgColor} ${voucher.borderColor} relative overflow-hidden`}
          >
            {/* Decorative circles */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-secondary-900 text-sm">{voucher.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-error" />
                  <span className="text-xs text-error font-medium">{voucher.expiresIn}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-secondary-200 pt-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-secondary-500">CODE: </span>
                <span className="font-mono font-bold text-secondary-800">{voucher.code}</span>
              </div>
              <button className="btn-primary btn-sm text-xs px-3 py-1.5">
                Lưu mã
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <button className="btn-outline btn-md inline-flex gap-2">
          Xem thêm voucher khác
          <span>▼</span>
        </button>
      </div>
    </div>
  )
}
