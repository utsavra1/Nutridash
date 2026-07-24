import styles from './Badge.module.css'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>
}