import Image from 'next/image'
import Link from 'next/link'

export default function HeroBanner() {
  return (
    <section className="container-page py-6">
      <div className="relative rounded-3xl overflow-hidden bg-[linear-gradient(305deg,theme(colors.primary.50),theme(colors.orange.200))] p-8 md:p-12">
        <div className="relative z-10 max-w-lg">
          <span className="inline-block text-xs font-semibold text-primary bg-primary-100 px-3 py-1 rounded-full mb-4">
            ⚡ Ưu đãi độc quyền
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
            Giảm giá <span className="text-primary">50%</span>
            <br />
            cho đơn đầu tiên
          </h1>
          <p className="text-secondary-600 mb-8 leading-relaxed">
            Thưởng thức món ngon mỗi ngày với dịch vụ giao hàng nhanh chóng và chất lượng nhất.
          </p>
          <Link href="/menu" className="btn-primary btn-lg inline-flex">
            Đặt ngay
          </Link>
        </div>

        {/* Decorative pizza image */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:block">
          <Image
          src='https://res.cloudinary.com/ddtccmifs/image/upload/v1774103183/bun-cha-ha-noi-1-1024x682_qr95lr.webp'   
          alt=''
          width={360}
          height={100}
          className="rounded-xl"
        />
        </div>
      </div>
    </section>
  )
}
