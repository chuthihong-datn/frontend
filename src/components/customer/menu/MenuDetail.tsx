import { getProductDetailApi } from '@/api/menu'
import { Star } from 'lucide-react'
import MenuDetailClient from './MenuDetailClient'
import type { ProductDetail } from '@/types'

interface MenuDetailProps {
  productId: number
}

export default async function MenuDetail({ productId }: MenuDetailProps) {
  const product: ProductDetail = await getProductDetailApi(productId)

  if (!product || !product.id) {
    return (
      <div className="container-page py-8">
        <p className="text-center text-secondary-500">Không tìm thấy sản phẩm</p>
      </div>
    )
  }

  return (
    <main className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm text-secondary-500">
        <a href="/" className="hover:text-primary transition-colors">
          Trang chủ
        </a>
        <span>/</span>
        <a href="/menu" className="hover:text-primary transition-colors">
          Thực đơn
        </a>
        <span>/</span>
        <span className="text-secondary-900 font-bold truncate">{product.name}</span>
      </nav>

      {/* Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Images */}
        <div className="flex flex-col gap-4">
          {/* Main Image */}
          <div
            className="w-full bg-center bg-no-repeat bg-cover aspect-square rounded-2xl shadow-sm"
            style={{
              backgroundImage: `url("${product.images?.[0] || '/images/placeholder.jpg'}")`,
            }}
          />

          {/* Thumbnail Carousel */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images?.map((image, idx) => (
              <div
                key={idx}
                className="min-w-[100px] h-[100px] bg-center bg-no-repeat bg-cover rounded-lg border-2 border-primary/30 hover:border-primary cursor-pointer transition-all"
                style={{ backgroundImage: `url("${image}")` }}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Details & Ordering */}
        <MenuDetailClient product={product} />
      </div>

      {/* Reviews Section */}
      <div className="mt-20 border-t border-secondary-200 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">Đánh giá từ khách hàng</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={`${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-secondary-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold">{product.rating?.toFixed(1) || '0.0'}/5</span>
              <span className="text-secondary-500">({product.reviewCount || 0} đánh giá)</span>
            </div>
          </div>
          {product.reviewCount > 0 && (
            <button className="px-6 py-2 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
              Viết đánh giá
            </button>
          )}
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 gap-6">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-xl border border-secondary-200 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-secondary-900">{review.userName}</h4>
                    <p className="text-xs text-secondary-500">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-secondary-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-secondary-700 italic">"{review.comment}"</p>
              </div>
            ))
          ) : (
            <p className="text-center text-secondary-500 py-8">Chưa có đánh giá nào</p>
          )}
        </div>

        {product.reviews && product.reviews.length > 3 && (
          <div className="flex justify-center mt-8">
            <button className="text-primary font-bold hover:underline">
              Xem thêm đánh giá →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
