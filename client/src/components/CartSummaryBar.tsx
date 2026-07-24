'use client';
import { useCartStore } from '../stores/cart-store';
import styles from './CartSummaryBar.module.css';

export function CartSummaryBar() {
  const { items, getTotalPrice, getTotalCalories, getAverageHealthScore, toggleCart } =
    useCartStore();

  if (items.length === 0) return null;

  const totalPrice = getTotalPrice();
  const totalCalories = getTotalCalories();
  const avgHealthScore = getAverageHealthScore();

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.item}>
          <span className={styles.label}>Total Price</span>
          <span className={styles.value}>Rs. {totalPrice.toFixed(2)}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Calories</span>
          <span className={styles.value}>{totalCalories} kcal</span>
        </div>
        {avgHealthScore !== null && (
          <div className={styles.item}>
            <span className={styles.label}>Health Score</span>
            <span className={styles.value}>{avgHealthScore}/100</span>
          </div>
        )}
      </div>
      <button className={styles.button} onClick={toggleCart}>
        View Cart ({items.reduce((sum, i) => sum + i.quantity, 0)})
      </button>
    </div>
  );
}
