'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/Card'
import { useAuthStore } from '../../stores/auth-store';
import { superAdminApi } from '../../lib/api';
import styles from './page.module.css'

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { user, logout, hasHydrated } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['superAdminDashboardStats'],
    queryFn: () => superAdminApi.getDashboardStats(),
    enabled: hasHydrated && !!user && user.role === 'SUPER_ADMIN',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'SUPER_ADMIN') {
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
          <p className={styles.adminBadge}>Super Admin</p>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/super-admin" className={styles.navItemActive}>
            <span className={styles.navIcon}>📊</span>
            Dashboard
          </Link>
          <Link href="/super-admin/restaurants" className={styles.navItem}>
            <span className={styles.navIcon}>🏪</span>
            Restaurants
          </Link>
          <Link href="/super-admin/users" className={styles.navItem}>
            <span className={styles.navIcon}>👥</span>
            Users
          </Link>
          <Link href="/super-admin/orders" className={styles.navItem}>
            <span className={styles.navIcon}>📦</span>
            Orders
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
            <h1 className={styles.pageTitle}>Super Admin Dashboard</h1>
            <p className={styles.pageSubtitle}>Platform Overview</p>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <div className={styles.statIcon}>🏪</div>
              <div>
                <p className={styles.statLabel}>Total Restaurants</p>
                <p className={styles.statValue}>
                  {isLoading ? '...' : stats?.totalRestaurants || 0}
                </p>
                <p className={styles.statSubtext}>
                  {isLoading ? '' : `${stats?.activeRestaurants || 0} active`}
                </p>
              </div>
            </Card>
            <Card className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div>
                <p className={styles.statLabel}>Total Users</p>
                <p className={styles.statValue}>
                  {isLoading ? '...' : stats?.totalUsers || 0}
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
          </div>

          <div className={styles.quickActions}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.actionsGrid}>
              <Link href="/super-admin/restaurants" className={styles.actionCard}>
                <div className={styles.actionIcon}>🏪</div>
                <h3 className={styles.actionTitle}>Manage Restaurants</h3>
                <p className={styles.actionDescription}>
                  Create, activate, and deactivate restaurants on the platform
                </p>
              </Link>

              <Link href="/super-admin/users" className={styles.actionCard}>
                <div className={styles.actionIcon}>👥</div>
                <h3 className={styles.actionTitle}>Manage Users</h3>
                <p className={styles.actionDescription}>
                  View, suspend, and reinstate user accounts
                </p>
              </Link>

              <Link href="/super-admin/orders" className={styles.actionCard}>
                <div className={styles.actionIcon}>📦</div>
                <h3 className={styles.actionTitle}>Monitor Orders</h3>
                <p className={styles.actionDescription}>
                  Platform-wide order tracking and analytics
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
