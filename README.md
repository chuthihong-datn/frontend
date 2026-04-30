# 🍴 FoodyDelivery — Next.js Basecode

Dự án food delivery được xây dựng với **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Zustand**, và **TanStack Query**.

---

## 🚀 Cài đặt

```bash
# Clone hoặc copy project
cd foody-delivery

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
├── api/                            # API layer theo từng module
│   ├── adminAccount.ts
│   ├── adminCategory.ts
│   ├── adminMenu.ts
│   ├── adminPromotion.ts
│   ├── adminStatistic.ts
│   ├── adminTopping.ts
│   ├── auth.ts
│   ├── cart.ts
│   ├── category.ts
│   ├── index.ts
│   ├── menu.ts
│   ├── order.ts
│   ├── user.ts
│   └── ward.ts
├── app/                            # Next.js App Router
│   ├── layout.tsx
│   ├── (admin)/                    # Route group: Admin
│   │   ├── layout.tsx
│   │   ├── accounts/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── delivery-address/page.tsx
│   │   ├── menus/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── promotions/page.tsx
│   │   └── toppings/page.tsx
│   ├── (auth)/                     # Route group: Auth
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (customer)/                 # Route group: Customer
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── cart/page.tsx
│   │   ├── menu/page.tsx
│   │   ├── menu/[id]/page.tsx
│   │   ├── payment/page.tsx
│   │   ├── payment/success/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── profile/my-voucher/page.tsx
│   │   ├── profile/orders/page.tsx
│   │   └── voucher/page.tsx
│   └── api/payment/vnpay-return/route.ts
├── components/
│   ├── customer/
│   │   ├── home/
│   │   ├── menu/
│   │   └── profile/
│   ├── layout/
│   │   ├── admin/
│   │   └── customer/
│   └── shared/
├── hooks/
│   └── index.ts
├── lib/
│   ├── api.ts
│   ├── utils.ts
│   └── services/
│       ├── authService.ts
│       ├── orderService.ts
│       └── productService.ts
├── store/
│   ├── authStore.ts
│   └── cartStore.ts
├── styles/
│   └── globals.css
└── types/
    └── index.ts
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
