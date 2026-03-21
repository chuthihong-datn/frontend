# 🍴 FoodyDelivery — Next.js Basecode

Dự án food delivery được xây dựng với **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Zustand**, và **TanStack Query**.

---

## 🚀 Cài đặt

```bash
# Clone hoặc copy project
cd foodie-delivery

# Cài dependencies
npm install

# Tạo file env
cp .env.example .env.local

# Khởi động dev server
npm run dev
```

---

## 📁 Cấu trúc thư mục

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Route group: Auth (không có header/footer)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (customer)/             # Route group: Giao diện khách hàng
│   │   ├── layout.tsx          # Layout với Header + Footer
│   │   ├── page.tsx            # Trang chủ
│   │   ├── menu/
│   │   │   ├── page.tsx        # Danh sách món ăn
│   │   │   └── [id]/page.tsx   # Chi tiết món ăn
│   │   ├── cart/page.tsx       # Giỏ hàng & thanh toán
│   │   ├── voucher/page.tsx    # Kho voucher
│   │   └── profile/page.tsx   # Tài khoản người dùng
│   └── (admin)/                # Route group: Admin Dashboard
│       ├── layout.tsx          # Layout với Sidebar + Header
│       ├── dashboard/page.tsx
│       ├── orders/page.tsx
│       ├── products/page.tsx
│       └── users/page.tsx
│
├── components/
│   ├── layout/
│   │   ├── customer/           # CustomerHeader, CustomerFooter
│   │   └── admin/              # AdminSidebar, AdminHeader
│   ├── customer/
│   │   ├── home/               # HeroBanner, CategorySection, FeaturedProducts
│   │   ├── menu/               # ProductCard, MenuFilter, MenuGrid
│   │   ├── cart/               # CartItem, CartSummary
│   │   ├── voucher/            # VoucherCard
│   │   └── profile/            # OrderHistory, ProfileForm
│   ├── admin/                  # AdminTable, StatsCard, ...
│   ├── shared/                 # QueryProvider, Pagination, ...
│   └── ui/                     # Button, Input, Modal, ... (design system)
│
├── lib/
│   ├── api.ts                  # Axios instance + interceptors
│   ├── utils.ts                # cn(), formatPrice(), formatDate(), ...
│   └── services/
│       ├── productService.ts
│       ├── orderService.ts
│       └── authService.ts
│
├── hooks/
│   └── index.ts                # useProducts, useOrders, useLogin, ...
│
├── store/
│   ├── cartStore.ts            # Zustand: Cart state
│   └── authStore.ts            # Zustand: Auth state
│
├── types/
│   └── index.ts                # TypeScript interfaces
│
└── styles/
    └── globals.css             # Tailwind + CSS variables + utility classes
```

---

## 🛠️ Tech Stack

| Layer | Thư viện |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (persist) |
| Data Fetching | TanStack Query v5 |
| HTTP Client | Axios |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Toast | Sonner |
| UI Primitives | Radix UI |

---

## 🎨 Design System

### Colors
- **Primary**: `#F97316` (orange) — CTA, active states
- **Secondary**: `#1C1C1E` (dark) — text, backgrounds
- **Background**: `#FAF9F6` — page background
- **Surface**: `#FFFFFF` — card backgrounds

### Utility Classes (globals.css)
```css
.btn-primary     /* Orange button */
.btn-outline     /* Outlined button */
.btn-ghost       /* Ghost button */
.btn-sm .btn-md .btn-lg  /* Sizes */
.card            /* White card with shadow */
.card-hover      /* Card with hover shadow */
.input           /* Styled input */
.badge-new .badge-sale .badge-hot
.status-pending .status-delivered ...
.section-title   /* H2 heading */
.container-page  /* Max-width container */
```

---

## 🌐 Biến môi trường (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## 🔌 Kết nối Backend API

Thay thế mock data bằng API calls thực:

1. **Products**: `src/lib/services/productService.ts`
2. **Orders**: `src/lib/services/orderService.ts`
3. **Auth**: `src/lib/services/authService.ts`

Tất cả API calls đều dùng `axios` instance tại `src/lib/api.ts` với:
- Auto-attach JWT token từ Zustand store
- Auto-redirect về `/login` khi token hết hạn (401)

---

## 📦 Mở rộng

### Thêm trang mới (Customer)
```
src/app/(customer)/ten-trang/page.tsx
```

### Thêm trang Admin
```
src/app/(admin)/ten-trang/page.tsx
```

### Thêm component
```
src/components/customer/[feature]/ComponentName.tsx
```
