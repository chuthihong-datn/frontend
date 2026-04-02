'use client'

import { useState } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { User } from '@/types'
import { updateProfile } from '@/api/user'
import { useAuthStore } from '@/store/authStore'

interface EditProfileModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function EditProfileModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditProfileModalProps) {
  const { setUser, accessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(user?.avtUrl)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast.error('Vui lòng nhập tên đầy đủ')
      return
    }

    setIsLoading(true)
    try {
      const response = await updateProfile(
        {
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        },
        selectedFile || undefined
      )

      // Update auth store with new user data
      if (user && accessToken) {
        const updatedUser = {
          ...user,
          name: response.fullName,
          email: response.email,
          phone: response.phone,
          avtUrl: response.avtUrl,
        }
        setUser(updatedUser, accessToken)
      }

      toast.success('Cập nhật hồ sơ thành công!')
      onClose()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      const message = error.response?.data?.message || 'Lỗi cập nhật hồ sơ'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-secondary-900">Chỉnh sửa hồ sơ</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-secondary-400 hover:text-secondary-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">Ảnh đại diện</label>
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-primary font-bold text-xl">
                    {fullName[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <label className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isLoading}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary-100 text-secondary-700 cursor-pointer hover:bg-secondary-200 transition-colors disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Chọn ảnh</span>
                </div>
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">Tên đầy đủ</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              placeholder="Nhập tên đầy đủ"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-secondary-100"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              placeholder="Nhập số điện thoại"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-secondary-100"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-secondary-50 text-secondary-500 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-secondary-500">Email không thể thay đổi</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-secondary-700 font-medium hover:bg-secondary-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
