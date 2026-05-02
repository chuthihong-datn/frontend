'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { getProfile } from '@/api/user'

/**
 * AuthProvider validates the stored token on app startup.
 * If the token is invalid or expired, it logs out the user and redirects to login.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { accessToken, logout } = useAuthStore()

  useEffect(() => {
    const validateToken = async () => {
      // Don't validate if user is already on login/register pages
      if (pathname?.includes('/login') || pathname?.includes('/register')) {
        return
      }

      // If there's a token, try to validate it
      if (accessToken) {
        try {
          // Attempt to fetch user profile to validate token
          await getProfile()
          // Token is valid, no action needed
        } catch (error: any) {
          const status = error?.response?.status
          // If 401 or token-related error, logout and redirect
          if (status === 401) {
            logout()
            router.push('/login')
          }
        }
      }
    }

    validateToken()
  }, [accessToken, pathname, logout, router])

  return <>{children}</>
}
