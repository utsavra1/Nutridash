"use client";
import styles from "./AllergenWarning.module.css";

interface AllergenWarningProps {
  isOpen: boolean;
  conflictingAllergens: string[];
  onClose: () => void;
  onConfirm: () => void;
}

export function AllergenWarning({
  isOpen,
  conflictingAllergens,
  onClose,
  onConfirm,
}: AllergenWarningProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>⚠️ Allergen Warning</h2>
        <p>This item contains allergens you have listed in your health profile:</p>
        <ul className={styles.allergenList}>
          {conflictingAllergens.map((allergen, index) => (
            <li key={index} className={styles.allergenItem}>
              {allergen}
            </li>
          ))}
        </ul>
        <div className={styles.buttonGroup}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Add Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
