"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../stores/cart-store";
import styles from "./page.module.css";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalCalories, getAverageHealthScore } = useCartStore();
  const totalPrice = getTotalPrice();
  const totalCalories = getTotalCalories();
  const avgHealthScore = getAverageHealthScore();

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <Link href="/restaurants" className={styles.backLink}>
          ← Back to Restaurants
        </Link>
        <div className={styles.emptyCart}>
          <h1 className={styles.title}>Your Cart is Empty</h1>
          <p>Add some delicious items to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/restaurants/${items[0].menuItem.restaurantId}`} className={styles.backLink}>
        ← Back to Restaurant
      </Link>
      <h1 className={styles.title}>Your Cart</h1>

      <div className={styles.cartItems}>
        {items.map((cartItem) => (
          <div key={cartItem.menuItem.id} className={styles.cartItem}>
            <div className={styles.itemInfo}>
              <div className={styles.itemName}>{cartItem.menuItem.name}</div>
              <div className={styles.itemPrice}>
                Rs. {(cartItem.menuItem.priceRs / 100).toFixed(2)} each
              </div>
            </div>
            <div className={styles.quantityControls}>
              <button
                className={styles.quantityButton}
                onClick={() => {
                  if (cartItem.quantity > 1) {
                    updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1);
                  } else {
                    removeItem(cartItem.menuItem.id);
                  }
                }}
              >
                -
              </button>
              <span className={styles.quantity}>{cartItem.quantity}</span>
              <button
                className={styles.quantityButton}
                onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              className={styles.removeButton}
              onClick={() => removeItem(cartItem.menuItem.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className={styles.cartSummary}>
        <div className={styles.summaryRow}>
          <span>Total Items:</span>
          <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Total Calories:</span>
          <span>{totalCalories} kcal</span>
        </div>
        {avgHealthScore !== null && (
          <div className={styles.summaryRow}>
            <span>Average Health Score:</span>
            <span>{avgHealthScore}/100</span>
          </div>
        )}
        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span>Total Price:</span>
          <span>Rs. {(totalPrice / 100).toFixed(2)}</span>
        </div>
      </div>

      <button
        className={styles.checkoutButton}
        onClick={() => router.push("/checkout")}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}