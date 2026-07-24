"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../../../lib/api";
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

export default function OrderDetailPage() {
  const { id } = useParams();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("success") === "true") {
        setIsSuccess(true);
      }
    }
  }, []);

  const queryClient = useQueryClient();
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.getOrderById(id as string),
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelOrder(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.container}>
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isSuccess && (
        <div className={styles.successHero}>
          <div className={styles.successBadgeIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className={styles.successTitle}>Thank you for your purchase!</h1>
          <p className={styles.successDescription}>
            Your payment was successful and your healthy meal is being prepared. You can track the status of your delivery below or continue browsing options.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/restaurants" className={styles.primaryCta}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Continue Browsing
            </Link>
            <Link href="/orders" className={styles.secondaryCta}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              View My Orders
            </Link>
          </div>
        </div>
      )}

      <Link href="/orders" className={styles.backLink}>
        ← Back to Orders
      </Link>

      <div className={styles.orderHeader}>
        <h1 className={styles.title}>Order #{order.id.slice(0, 8)}</h1>
        <span className={`${styles.status} ${getStatusClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Order Items</h3>
        <div className={styles.itemsList}>
          {order.orderItems.map((item: any) => (
            <div key={item.id} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>
                  {item.menuItem?.name || "Unknown Item"} x {item.quantity}
                </div>
              </div>
              <div className={styles.itemPrice}>
                Rs. {((item.unitPriceRs * item.quantity) / 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Subtotal:</span>
          <span>Rs. {(order.totalPriceRs / 100).toFixed(2)}</span>
        </div>
        {order.totalCalories && (
          <div className={styles.summaryRow}>
            <span>Total Calories:</span>
            <span>{order.totalCalories} kcal</span>
          </div>
        )}
        {order.healthScoreAvg && (
          <div className={styles.summaryRow}>
            <span>Average Health Score:</span>
            <span>{order.healthScoreAvg}/100</span>
          </div>
        )}
        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span>Total:</span>
          <span>Rs. {(order.totalPriceRs / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Delivery Address</h3>
        <p>{order.deliveryAddress}</p>
      </div>

      {order.status === "PENDING" && (
        <button
          className={styles.cancelButton}
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? "Cancelling..." : "Cancel Order"}
        </button>
      )}
    </div>
  );
}