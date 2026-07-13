"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth-store";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../lib/api";
import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout: clearAuth } = useAuthStore();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      router.push("/login");
    },
  });

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        🌱 NutriDash
      </Link>
      <nav className={styles.nav}>
        {isAuthenticated ? (
          <div className={styles.userSection}>
            <Link href="/dashboard" className={styles.linkButton}>
              Dashboard
            </Link>
            <Link href="/restaurants" className={styles.linkButton}>
              Restaurants
            </Link>
            <div className={styles.userInfo}>
              <span className={styles.userAvatar}>{user?.name[0].toUpperCase()}</span>
              <span className={styles.userName}>{user?.name}</span>
            </div>
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
            <Link href="/login" className={styles.linkButton}>Login</Link>
            <Link href="/register" className={styles.primaryButton}>Sign Up</Link>
          </div>
        )}
      </nav>
    </header>
  );
}