'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, UtensilsCrossed } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { loginApi} from '@/api/auth'
import { UserRole } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await loginApi(form)
      const role: UserRole = res.role === 'ADMIN' ? 'admin' : 'customer'

      setUser(
        {
          id: res.id,
          name: res.fullName,
          email: res.email,
          role: role,
          createdAt: new Date().toISOString(),
        },
        res.token
      )

      toast.success("Đăng nhập thành công!", { duration: 2000 })

      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }

    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Email hoặc mật khẩu không đúng'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex">
      {/* Left: Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-secondary-900">
        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"
          alt="Food"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="flex items-center gap-2 mb-8">
            <UtensilsCrossed strokeWidth={2} className='text-white' />
            <span className="font-bold text-2xl text-white">FoodieDelivery</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">
            Giao hàng tận nơi,<br />Món ngon tận hưởng
          </h2>
          <p className="text-white/70 text-lg">
            Hàng trăm món ăn ngon đang chờ bạn khám phá
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link href="/" className="text-sm text-secondary-500 hover:text-primary flex items-center gap-1 mb-6">
              ← Trang chủ
            </Link>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Chào mừng trở lại!
            </h1>
            <p className="text-secondary-500">Vui lòng nhập thông tin để đăng nhập</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 border-b border-border">
            <Link href="/login" className="pb-2 px-1 mr-6 text-sm font-semibold text-primary border-b-2 border-primary -mb-px">
              Đăng nhập
            </Link>
            <Link href="/register" className="pb-2 px-1 text-sm font-medium text-secondary-500 hover:text-secondary-700">
              Đăng ký
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-secondary-700">Mật khẩu</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary btn-lg w-full mt-2"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm text-secondary-500 mt-6">
            Bạn chưa có tài khoản?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Tạo tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
