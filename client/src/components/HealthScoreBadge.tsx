import styles from "./HealthScoreBadge.module.css";

interface HealthScoreBadgeProps {
  score?: number | null;
}

export function HealthScoreBadge({ score }: HealthScoreBadgeProps) {
  if (score === null || score === undefined) {
    return <span className={`${styles.badge} ${styles.badgeDefault}`}>Score N/A</span>;
  }

  let variantClass = styles.badgeLow;
  if (score >= 70) variantClass = styles.badgeHigh;
  else if (score >= 40) variantClass = styles.badgeMedium;

  return <span className={`${styles.badge} ${variantClass}`}>Score: {score}</span>;
}