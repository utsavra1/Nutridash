import { NutritionInfo } from "../types";
import styles from "./NutritionCard.module.css";

interface NutritionCardProps {
  nutrition?: NutritionInfo | null;
}

export function NutritionCard({ nutrition }: NutritionCardProps) {
  if (!nutrition) {
    return (
      <div className={styles.nutritionCard}>
        <p className={styles.label}>Nutrition information unavailable</p>
      </div>
    );
  }

  return (
    <div className={styles.nutritionCard}>
      <h3 className={styles.title}>Nutrition Facts</h3>
      {nutrition.servingSize && (
        <p className={styles.servingSize}>Serving: {nutrition.servingSize}</p>
      )}
      <div className={styles.grid}>
        <div className={styles.gridItem}>
          <p className={styles.caloriesValue}>{nutrition.calories}</p>
          <p className={styles.label}>Calories</p>
        </div>
        <div className={styles.gridItem}>
          <p className={styles.macroValue}>{nutrition.proteinG}g</p>
          <p className={styles.label}>Protein</p>
        </div>
        <div className={styles.gridItem}>
          <p className={styles.macroValue}>{nutrition.carbsG}g</p>
          <p className={styles.label}>Carbs</p>
        </div>
        <div className={styles.gridItem}>
          <p className={styles.macroValue}>{nutrition.fatG}g</p>
          <p className={styles.label}>Fat</p>
        </div>
        <div className={`${styles.gridItem} ${styles.fullWidth}`}>
          <p className={styles.macroValue}>{nutrition.fiberG}g</p>
          <p className={styles.label}>Fiber</p>
        </div>
      </div>
      {nutrition.allergens.length > 0 && (
        <div className={styles.allergensSection}>
          <p className={styles.allergensTitle}>Allergens:</p>
          <div className={styles.allergensList}>
            {nutrition.allergens.map((allergen) => (
              <span key={allergen} className={styles.allergenTag}>
                {allergen}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}