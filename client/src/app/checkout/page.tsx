"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useCartStore } from "../../stores/cart-store";
import { ordersApi } from "../../lib/api";
import styles from "./page.module.css";


export default function CheckoutPage(){
    const router = useRouter();
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const {items, clearCart, getTotalPrice} = useCartStore();
    const totalPrice = getTotalPrice();

    const orderMutation = useMutation({
        mutationFn: ordersApi.createOrder,
        onSuccess: (data) => {
            clearCart();
            router.push(`/orders/${data.id}`);  
        },
        onError: (error) => {
            console.error("Order failed:", error);
        },
    });


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        orderMutation.mutate({
            items: items.map((item) => ({
                menuItemId: item.menuItem.id,
                quantity: item.quantity,
            })),
            deliveryAddress,
        });
    };

    if (items.length === 0){
        router.push("/cart");
        return null;
    }

    return (
    <div className={styles.container}>
      <Link href="/cart" className={styles.backLink}>
        ← Back to Cart
      </Link>
      <h1 className={styles.title}>Checkout</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="address">
            Delivery Address
          </label>
          <textarea
            id="address"
            className={styles.textarea}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter your delivery address..."
            required
          />
        </div>

        <div className={styles.orderSummary}>
          <h3>Order Summary</h3>
          <div className={styles.summaryRow}>
            <span>Items:</span>
            <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total:</span>
            <span>Rs. {(totalPrice / 100).toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={orderMutation.isPending || !deliveryAddress}
        >
          {orderMutation.isPending ? "Placing Order..." : "Place Order"}
        </button>

        {orderMutation.isError && (
          <div className={styles.error}>
            Failed to place order. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}

