'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card } from '../../../components/Card'
import { Badge } from '../../../components/Badge'
import { superAdminApi } from '../../../lib/api'
import { Order } from '../../../types'
import styles from './page.module.css'

const StatusBadge = ({ status }: { status: string }) => {
  const variantMap: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
    PENDING: 'warning',
    CONFIRMED: 'default',
    PREPARING: 'default',
    OUT_FOR_DELIVERY: 'default',
    DELIVERED: 'success',
    CANCELLED: 'danger'
  }
  return <Badge variant={variantMap[status] || 'default'}>{status.replace('_', ' ')}</Badge>
}

export default function SuperAdminOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['superAdmin', 'orders'],
    queryFn: () => superAdminApi.getOrders()
  })

  if (isLoading) return <div className={styles.container}>Loading...</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/super-admin" className={styles.backLink}>← Back to Dashboard</Link>
        <h1>All Orders</h1>
      </div>
      <div className={styles.grid}>
        {orders?.map((order) => (
          <Card key={order.id} className={styles.itemCard}>
            <div className={styles.itemHeader}>
              <h2>Order #{order.id.slice(0, 8)}</h2>
              <StatusBadge status={order.status} />
            </div>
            <p>Total: Rs. {(order.totalPriceRs / 100).toFixed(2)}</p>
            <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            <p>Delivery Address: {order.deliveryAddress}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}