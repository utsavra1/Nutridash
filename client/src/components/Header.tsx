"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth-store";
import { useCartStore } from "../stores/cart-store";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../lib/api";
import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout: clearAuth } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      router.push("/login");
    },
  });

  const itemCount = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const CartButton = (
    <button
      className={styles.cartButton}
      onClick={toggleCart}
      aria-label="Toggle shopping cart"
    >
      <span className={styles.cartIconWrapper}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
      </span>
      <span className={styles.cartText}>Cart</span>
    </button>
  );

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        🌱 NutriDash
      </Link>
      <nav className={styles.nav}>
        {isAuthenticated ? (
          <div className={styles.userSection}>
            <Link href="/dashboard" className={styles.linkButton}>Dashboard</Link>
            <Link href="/restaurants" className={styles.linkButton}>Restaurants</Link>
            <Link href="/orders" className={styles.linkButton}>Orders</Link>
            {CartButton}
            <Link href="/profile" className={styles.userInfo} title="My Profile">
              <span className={styles.userAvatar}>{user?.name[0].toUpperCase()}</span>
              <span className={styles.userName}>{user?.name}</span>
            </Link>
            <button
              onClick={() => logoutMutation.mutate()}
              className={styles.logoutButton}
              disabled={logoutMutation.isPending}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className={styles.authButtons}>
            {CartButton}
            <Link href="/login" className={styles.linkButton}>Login</Link>
            <Link href="/register" className={styles.primaryButton}>Sign Up</Link>
          </div>
        )}
      </nav>
    </header>
  );
}