"use client";
import styles from "./GoogleButton.module.css";

interface Props {
  label?: string;
}

export default function GoogleButton({ label = "Continue with Google" }: Props) {
  const handleClick = () => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
      "http://localhost:3001";
    window.location.href = `${apiBase}/api/v1/auth/google`;
  };

  return (
    <button type="button" onClick={handleClick} className={styles.btn}>
      {/* Official Google "G" SVG */}
      <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.7 3.7 14.6l7 5.4C12.4 13.9 17.7 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z"/>
        <path fill="#FBBC05" d="M10.7 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.7-4.6l-7-5.4A23 23 0 0 0 1 24c0 3.8.9 7.4 2.7 10.5l7-5.9z"/>
        <path fill="#34A853" d="M24 47c5.4 0 10-1.8 13.3-4.8l-7.4-5.7c-1.8 1.2-4.1 2-5.9 2-6.3 0-11.6-4.3-13.5-10.1l-7 5.9C7 41.3 14.8 47 24 47z"/>
        <path fill="none" d="M1 1h46v46H1z"/>
      </svg>
      <span>{label}</span>
    </button>
  );
}
