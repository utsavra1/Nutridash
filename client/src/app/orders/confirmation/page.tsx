"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "../../../lib/api";
import styles from "./page.module.css";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");

  // If no order id, redirect away
  useEffect(() => {
    if (!orderId) router.replace("/restaurants");
  }, [orderId, router]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.getOrderById(orderId!),
    enabled: !!orderId,
  });

  if (!orderId) return null;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>

        {/* ── Hero ── */}
        <div className={styles.hero}>
          <div className={styles.iconRing}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className={styles.heroTitle}>Thank you for your order! 🎉</h1>
          <p className={styles.heroSub}>
            Your payment was successful. Your healthy meal is being prepared and will be on its way soon.
          </p>
          <div className={styles.orderId}>
            Order #{orderId.slice(0, 8).toUpperCase()}
          </div>
        </div>

        {/* ── Order summary ── */}
        {isLoading ? (
          <div className={styles.card}>
            <p className={styles.loadingText}>Loading order details…</p>
          </div>
        ) : order ? (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order Summary</h2>

            {/* Restaurant + status */}
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Restaurant</span>
                <span className={styles.metaValue}>{order.restaurant?.name ?? "—"}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Status</span>
                <span className={styles.statusBadge}>{order.status}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Placed at</span>
                <span className={styles.metaValue}>
                  {new Date(order.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className={styles.itemsList}>
              {order.orderItems.map((item: any) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <span className={styles.itemEmoji}>🍽️</span>
                    <div>
                      <p className={styles.itemName}>{item.menuItem?.name ?? "Item"}</p>
                      <p className={styles.itemQty}>Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className={styles.itemPrice}>
                    Rs. {(item.unitPriceRs * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Delivery Fee</span>
                <span className={styles.free}>FREE</span>
              </div>
              {order.totalCalories && (
                <div className={styles.totalRow}>
                  <span>Total Calories</span>
                  <span>{order.totalCalories} kcal</span>
                </div>
              )}
              {order.healthScoreAvg && (
                <div className={styles.totalRow}>
                  <span>Avg Health Score</span>
                  <span>{order.healthScoreAvg}/100</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total Paid</span>
                <span>Rs. {order.totalPriceRs.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery address */}
            <div className={styles.addressBox}>
              <span className={styles.addressLabel}>📍 Delivering to</span>
              <span className={styles.addressText}>{order.deliveryAddress}</span>
            </div>
          </div>
        ) : null}

        {/* ── CTA buttons ── */}
        <div className={styles.ctas}>
          <Link href="/restaurants" className={styles.primaryBtn}>
            Browse More Restaurants
          </Link>
          <Link href="/orders" className={styles.secondaryBtn}>
            View All Orders
          </Link>
        </div>

      </div>
    </div>
  );
}
