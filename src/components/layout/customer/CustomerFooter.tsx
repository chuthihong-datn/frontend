import Link from "next/link";
import { Facebook, Instagram, Mail, UtensilsCrossed } from "lucide-react";

export default function CustomerFooter() {
  return (
    <footer className="bg-secondary-900 text-secondary-300 mt-16">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 shrink-0 mb-4">
              <UtensilsCrossed strokeWidth={2} color="#f97316" />
              <span className="font-bold text-lg text-white">
                FoodyDelivery
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              Giao hàng tận nơi, món ngon tận hưởng. Chúng tôi kết nối bạn với
              những nhà hàng tốt nhất trong khu vực.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-8 h-8 bg-secondary-700 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-secondary-700 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Về chúng tôi", href: "/about" },
                { label: "Hệ thống cửa hàng", href: "/stores" },
                { label: "Tuyển dụng", href: "/careers" },
                { label: "Blog ẩm thực", href: "/blog" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Trung tâm trợ giúp", href: "/help" },
                { label: "Chính sách bảo mật", href: "/privacy" },
                { label: "Điều khoản dịch vụ", href: "/terms" },
                { label: "Hoàn tiền & trả hàng", href: "/refund" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4">Đăng ký nhận tin</h4>
            <p className="text-sm mb-3">Nhận ưu đãi mới nhất từ chúng tôi.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 px-3 py-2 bg-secondary-700 border border-secondary-600 rounded-xl text-sm 
                  text-white placeholder:text-secondary-400 focus:outline-none focus:border-primary"
              />
              <button className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors">
                Gửi
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-secondary-700 text-center text-xs text-secondary-500">
          © 2026 FoodyDelivery. Tất cả quyền được bảo lưu. Thiết kế bởi Hong Chu
        </div>
      </div>
    </footer>
  );
}
