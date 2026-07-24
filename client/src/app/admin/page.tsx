"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/Card';
import { useAuthStore } from '../../stores/auth-store';
import { adminApi } from '../../lib/api';
import styles from './page.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout, hasHydrated } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => adminApi.getDashboardStats(),
    enabled: hasHydrated && !!user && (user.role === 'RESTAURANT_ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'RESTAURANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>🍽️ NutriDash</h2>
          <p className={styles.adminBadge}>Restaurant Admin</p>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navItemActive}>
            <span className={styles.navIcon}>📊</span>
            Dashboard
          </Link>
          <Link href="/admin/menu-items" className={styles.navItem}>
            <span className={styles.navIcon}>🍔</span>
            Menu Items
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className={styles.userName}>{user.name}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Welcome back, {user.name}</p>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <div className={styles.statIcon}>🍔</div>
              <div>
                <p className={styles.statLabel}>Total Menu Items</p>
                <p className={styles.statValue}>
                  {isLoading ? '...' : stats?.totalMenuItems || 0}
                </p>
              </div>
            </Card>
            <Card className={styles.statCard}>
              <div className={styles.statIcon}>📦</div>
              <div>
                <p className={styles.statLabel}>Orders Today</p>
                <p className={styles.statValue}>
                  {isLoading ? '...' : stats?.todayOrders || 0}
                </p>
              </div>
            </Card>
            <Card className={styles.statCard}>
              <div className={styles.statIcon}>⭐</div>
              <div>
                <p className={styles.statLabel}>Avg Health Score</p>
                <p className={styles.statValue}>
                  {isLoading ? '...' : stats?.avgHealthScore || 0}
                </p>
              </div>
            </Card>
          </div>

          <div className={styles.quickActions}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.actionsGrid}>
              <Link href="/admin/menu-items" className={styles.actionCard}>
                <div className={styles.actionIcon}>🍔</div>
                <h3 className={styles.actionTitle}>Manage Menu Items</h3>
                <p className={styles.actionDescription}>
                  Add, edit, and remove menu items for your restaurant
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
