import styles from './Input.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = ({ label, className, ...props }: InputProps) => {
  return (
    <label className={`${styles.label} ${className || ''}`}>
      {label && <span className={styles.labelText}>{label}</span>}
      <input className={styles.input} {...props} />
    </label>
  )
}