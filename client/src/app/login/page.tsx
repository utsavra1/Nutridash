"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import Link from "next/link";
import styles from "./page.module.css";
import { Card } from "../../components/Card";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      if (data.user.isOnboardingComplete) {
        router.push("/");
      } else {
        router.push("/onboarding/health-profile");
      }
    },
    onError: (error: any) => {
      const errMessage = error.response?.data?.message;
      setError(Array.isArray(errMessage) ? errMessage.join(", ") : errMessage || "Invalid email or password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(formData);
  };

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className={styles.input}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className={styles.submitButton}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className={styles.footer}>
          Don't have an account? <Link href="/register" className={styles.link}>Sign up</Link>
        </div>
      </Card>
    </div>
  );
}