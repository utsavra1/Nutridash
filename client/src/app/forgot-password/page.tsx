"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../lib/api";
import Link from "next/link";
import styles from "./page.module.css";
import { Card } from "../../components/Card";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => {
      setSuccess(true);
      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    },
    onError: (error: any) => {
      const errMessage = error.response?.data?.message;
      setError(Array.isArray(errMessage) ? errMessage.join(", ") : errMessage || "Failed to send reset code");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    forgotPasswordMutation.mutate();
  };

  if (success) {
    return (
      <div className={styles.pageContainer}>
        <Card className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.successTitle}>Check your email</h1>
          <p className={styles.successMessage}>
            If an account with <strong>{email}</strong> exists, we've sent a verification code.
            Check your inbox and follow the instructions.
          </p>
          <p className={styles.redirectMessage}>
            Redirecting you to enter the code...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Forgot password?</h1>
          <p className={styles.subtitle}>
            Enter your email and we'll send you a code to reset your password
          </p>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className={styles.submitButton}
          >
            {forgotPasswordMutation.isPending ? "Sending code..." : "Send reset code"}
          </button>
        </form>
        <div className={styles.footer}>
          Remember your password? <Link href="/login" className={styles.link}>Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
