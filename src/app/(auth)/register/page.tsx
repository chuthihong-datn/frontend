'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  User,
  UtensilsCrossed,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { registerApi } from '@/api/auth'

export default function RegisterPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp')
      return
    }

    setIsLoading(true)

    try {
      const { confirmPassword, ...registerData } = form

      const res = await registerApi(registerData)

      if (res?.success === false) {
        toast.error(res.message || 'Đăng ký thất bại. Vui lòng thử lại', {
          duration: 2000,})
        return
      }

      toast.success(res?.message || 'Đăng ký thành công!', {
        duration: 2000,
      })

      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Đăng ký thất bại. Vui lòng thử lại'

      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-secondary-900">
        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"
          alt="Food"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="flex items-center gap-2 mb-8">
            <UtensilsCrossed className="text-white" />
            <span className="font-bold text-2xl text-white">
              FoodieDelivery
            </span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">
            Giao hàng tận nơi,
            <br />
            Món ngon tận hưởng
          </h2>
          <p className="text-white/70 text-lg">
            Hàng trăm món ăn ngon đang chờ bạn khám phá
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm text-secondary-500 hover:text-primary flex items-center gap-1 mb-6"
            >
              ← Trang chủ
            </Link>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Tạo tài khoản mới
            </h1>
            <p className="text-secondary-500">
              Vui lòng nhập thông tin để đăng ký
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 border-b border-border">
            <Link
              href="/login"
              className="pb-2 px-1 mr-6 text-sm text-secondary-500 hover:text-secondary-700"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="pb-2 px-1 text-sm font-semibold text-primary border-b-2 border-primary -mb-px"
            >
              Đăng ký
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="tel"
                  placeholder="0123456789"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <Eye /> : <EyeOff />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <Eye /> : <EyeOff />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary btn-lg w-full mt-6"
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center text-sm text-secondary-500 mt-6">
            Bạn đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}