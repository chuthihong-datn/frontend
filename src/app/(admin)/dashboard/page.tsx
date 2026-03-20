import { ShoppingBag, Users, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const STATS = [
  { label: 'Doanh thu hôm nay', value: formatPrice(4250000), change: '+12.5%', icon: DollarSign, color: 'text-primary', bg: 'bg-primary-50' },
  { label: 'Đơn hàng mới', value: '38', change: '+5', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Khách hàng', value: '1,240', change: '+23', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Tăng trưởng', value: '18.2%', change: '+2.1%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
]

const RECENT_ORDERS = [
  { id: '#FOOD-12345', customer: 'Nguyễn Văn A', items: 'Burger x2, Phở x1', total: 315000, status: 'shipping', time: '5 phút trước' },
  { id: '#FOOD-12344', customer: 'Trần Thị B', items: 'Pizza x1, Sushi x2', total: 520000, status: 'delivered', time: '12 phút trước' },
  { id: '#FOOD-12343', customer: 'Lê Minh C', items: 'Cơm x3', total: 195000, status: 'preparing', time: '20 phút trước' },
  { id: '#FOOD-12342', customer: 'Phạm Thu D', items: 'Sushi Set x1', total: 210000, status: 'confirmed', time: '35 phút trước' },
]

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'Chờ xác nhận', class: 'status-pending' },
  confirmed: { label: 'Đã xác nhận', class: 'status-confirmed' },
  preparing: { label: 'Đang chuẩn bị', class: 'status-preparing' },
  shipping: { label: 'Đang giao', class: 'status-shipping' },
  delivered: { label: 'Đã giao', class: 'status-delivered' },
  cancelled: { label: 'Đã hủy', class: 'status-cancelled' },
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-semibold text-success bg-green-50 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-secondary-900 mb-1">{stat.value}</p>
              <p className="text-sm text-secondary-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-secondary-900">Đơn hàng gần đây</h2>
          <a href="/orders" className="text-sm text-primary hover:underline">Xem tất cả</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-secondary-500 font-medium">Mã đơn</th>
                <th className="text-left py-3 px-2 text-secondary-500 font-medium">Khách hàng</th>
                <th className="text-left py-3 px-2 text-secondary-500 font-medium hidden md:table-cell">Món ăn</th>
                <th className="text-left py-3 px-2 text-secondary-500 font-medium">Tổng tiền</th>
                <th className="text-left py-3 px-2 text-secondary-500 font-medium">Trạng thái</th>
                <th className="text-left py-3 px-2 text-secondary-500 font-medium hidden sm:table-cell">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary-50 transition-colors">
                  <td className="py-3 px-2 font-mono font-semibold text-secondary-900">{order.id}</td>
                  <td className="py-3 px-2 font-medium">{order.customer}</td>
                  <td className="py-3 px-2 text-secondary-500 hidden md:table-cell">{order.items}</td>
                  <td className="py-3 px-2 font-semibold text-primary">{formatPrice(order.total)}</td>
                  <td className="py-3 px-2">
                    <span className={STATUS_MAP[order.status]?.class ?? 'badge'}>
                      {STATUS_MAP[order.status]?.label}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-secondary-400 hidden sm:table-cell">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
