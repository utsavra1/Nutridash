"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order } from "../../../types";
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
          {order.orderItems.map((item) => (
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