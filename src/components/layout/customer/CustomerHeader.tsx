"use client";

import Link from "next/link";
import { Search, ShoppingCart, User, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCartApi } from "@/api/cart";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import type { CartItem, CartItemResponse, Product, ProductSize, Topping } from "@/types";

const mapServerItemToStoreItem = (item: CartItemResponse): CartItem => {
  const quantity = Number(item.quantity) || 1;
  const itemTotal = Number(item.itemTotal) || 0;
  const hasFlashSale = item.isFlashSaleApplied === true || item.flashSaleApplied === true;
  const saleQuantity = Number(item.saleQuantity) || (hasFlashSale ? 1 : 0);
  const salePriceValue = Number(item.salePrice) || 0;
  
  // Recalculate unitPrice for regular items when flash sale is applied
  // to ensure size/topping prices are included
  let unitPrice = Number(item.price);
  if (hasFlashSale && saleQuantity > 0 && saleQuantity < quantity) {
    const regularQuantity = quantity - saleQuantity;
    const saleSubtotal = salePriceValue * saleQuantity;
    const regularSubtotal = itemTotal - saleSubtotal;
    if (regularQuantity > 0) {
      unitPrice = regularSubtotal / regularQuantity;
    }
  }

  const product: Product = {
    id: item.menuId ?? item.cartItemId,
    name: item.menuName,
    images: item.image ? [item.image] : [],
    rating: 0,
    minPrice: unitPrice,
  };

  const size: ProductSize | undefined = item.sizeName
    ? {
        id: 0,
        name: item.sizeName,
        extraPrice: 0,
      }
    : undefined;

  const toppings: Topping[] = (item.toppings || []).map((name, index) => ({
    id: index + 1,
    name,
    price: 0,
  }));

  return {
    id: String(item.cartItemId),
    product,
    quantity,
    size,
    toppings,
    unitPrice,
    salePrice: typeof item.salePrice === 'number' ? Number(item.salePrice) : undefined,
    isFlashSaleApplied: hasFlashSale,
    subtotal: itemTotal,
  };
};

export default function CustomerHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { itemCount, clearCart, setCartFromServer } = useCartStore();
  const { user, logout, accessToken } = useAuthStore();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    clearCart();
    router.push('/');
  };

  useEffect(() => {
    const syncCart = async () => {
      if (!accessToken) {
        clearCart();
        return;
      }

      try {
        const cart = await getCartApi(accessToken);
        const mappedItems = (cart.items || []).map(mapServerItemToStoreItem);
        setCartFromServer(mappedItems, Number(cart.totalAmount || 0));
      } catch {
        clearCart();
      }
    };

    syncCart();
  }, [accessToken, clearCart, setCartFromServer]);

  return (
    <header className="sticky top-0 z-50 bg-white/50 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container-page">
        <div className="flex items-center justify-between gap-6 h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <UtensilsCrossed strokeWidth={2} color="#f97316" />
            <span className="font-bold text-lg text-secondary-900">
              FoodyDelivery
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Tìm kiếm món ăn bạn yêu thích..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full pl-9 pr-4 py-2 text-sm bg-primary-50 border rounded-full outline-none border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:shadow-inner transition-all"
              />
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-secondary-700 hover:text-primary transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/menu"
              className="text-sm font-medium text-secondary-700 hover:text-primary transition-colors"
            >
              Thực đơn
            </Link>
            <Link
              href="/voucher"
              className="text-sm font-medium text-secondary-700 hover:text-primary transition-colors"
            >
              Voucher
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Cart */}
            <Link
              href="/cart"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="relative p-2 hover:bg-secondary-50 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-secondary-700" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative group">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-1 hover:bg-secondary-50 rounded-xl transition-colors"
                >
                  {user.avtUrl ? (
                    <img
                      src={user.avtUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {user.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </Link>
                {/* Dropdown */}
                <div
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-modal border border-border 
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                >
                  <div className="p-3 border-b border-border">
                    <p className="font-semibold text-sm text-secondary-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-secondary-500">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-xl"
                    >
                      <User className="w-4 h-4" />
                      Tài khoản
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-red-50 rounded-xl"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className="btn-primary btn-md">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
