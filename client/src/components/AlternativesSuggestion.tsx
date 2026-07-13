"use client";
import { MenuItem } from "../types";
import { HealthScoreBadge } from "./HealthScoreBadge";
import styles from "./AlternativesSuggestion.module.css";

interface AlternativesSuggestionProps {
  alternatives: Array<{ item: MenuItem; score: number }>;
}

export function AlternativesSuggestion({
  alternatives,
}: AlternativesSuggestionProps) {
  if (alternatives.length === 0) return null;

  return (
    <div className={styles.alternativesContainer}>
      <h3 className={styles.title}>💚 Healthier Alternatives</h3>
      <div className={styles.alternativesList}>
        {alternatives.map(({ item, score }) => (
          <div key={item.id} className={styles.alternativeItem}>
            <div className={styles.itemInfo}>
              <h4 className={styles.itemName}>{item.name}</h4>
              <p className={styles.itemPrice}>
                Rs. {(item.priceRs / 100).toFixed(2)}
              </p>
            </div>
            <HealthScoreBadge score={score} />
          </div>
        ))}
      </div>
    </div>
  );
}
