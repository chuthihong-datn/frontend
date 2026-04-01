import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from 'sonner'
import QueryProvider from '@/components/shared/QueryProvider'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FoodyDelivery – Giao hàng tận nơi',
    template: '%s | FoodyDelivery',
  },
  description:
    'Đặt món ăn ngon, giao hàng nhanh chóng và chất lượng nhất. FoodyDelivery – kết nối bạn với những nhà hàng tốt nhất trong khu vực.',
  keywords: ['đặt đồ ăn', 'giao hàng thức ăn', 'food delivery', 'FoodyDelivery'],
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${playfair.variable}`}>
      <body>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                fontFamily: 'var(--font-be-vietnam)',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
