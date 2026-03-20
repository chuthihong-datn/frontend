import CustomerHeader from '@/components/layout/customer/CustomerHeader'
import CustomerFooter from '@/components/layout/customer/CustomerFooter'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CustomerHeader />
      <main className="flex-1">{children}</main>
      <CustomerFooter />
    </div>
  )
}
