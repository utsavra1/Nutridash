"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Order } from "../../types";
import { ordersApi } from "../../lib/api";
import styles from "./page.module.css";

function getStatusClass(status: string) {
  switch (status) {
    case "PENDING":
      return styles.statusPENDING;
    case "CONFIRMED":
      return styles.statusCONFIRMED;
    case "PREPARING":
      return styles.statusPREPARING;
    case "OUT_FOR_DELIVERY":
      return styles.statusOUT_FOR_DELIVERY;
    case "DELIVERED":
      return styles.statusDELIVERED;
    case "CANCELLED":
      return styles.statusCANCELLED;
    default:
      return "";
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.getMyOrders,
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p>Error loading orders</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className={styles.container}>
        <Link href="/restaurants" className={styles.backLink}>
          ← Back to Restaurants
        </Link>
        <div className={styles.emptyOrders}>
          <h1 className={styles.title}>No Orders Yet</h1>
          <p>Place your first order to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/restaurants" className={styles.backLink}>
        ← Back to Restaurants
      </Link>
      <h1 className={styles.title}>Your Orders</h1>
      <div className={styles.ordersList}>
        {orders.map((order: Order) => (
          <div
            key={order.id}
            className={styles.orderCard}
            onClick={() => router.push(`/orders/${order.id}`)}
          >
            <div className={styles.orderHeader}>
              <span className={styles.orderId}>Order #{order.id.slice(0, 8)}</span>
              <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className={styles.orderDetails}>
              {order.restaurant?.name} • {new Date(order.createdAt).toLocaleDateString()}
            </div>
            <div className={styles.orderDetails}>
              {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} items
            </div>
            <div className={styles.total}>
              Total: Rs. {(order.totalPriceRs / 100).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
