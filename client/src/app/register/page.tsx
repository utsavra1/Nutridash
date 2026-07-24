"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import Link from "next/link";
import styles from "./page.module.css";
import { Card } from "../../components/Card";
import GoogleButton from "../../components/GoogleButton";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();

  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  // Step 1 — send OTP
  const sendOtpMutation = useMutation({
    mutationFn: () => authApi.sendOtp(formData.email),
    onSuccess: () => {
      setError("");
      setStep("otp");
      setResendCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to send verification code.");
    },
  });

  // Step 2 — verify OTP + register
  const registerMutation = useMutation({
    mutationFn: (code: string) =>
      authApi.register({ ...formData, otp: code }),
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      router.push("/onboarding/health-profile");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Invalid or expired code. Try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    sendOtpMutation.mutate();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();

    const code = next.join("");
    if (code.length === 6) {
      registerMutation.mutate(code);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) registerMutation.mutate(pasted);
  };

  // ── Step 1 — Registration form ─────────────────────────────────────────
  if (step === "form") {
    return (
      <div className={styles.pageContainer}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Create an account</h1>
            <p className={styles.subtitle}>Join NutriDash today</p>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleFormSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                required
                className={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
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
                minLength={8}
                className={styles.input}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={sendOtpMutation.isPending}
              className={styles.submitButton}
            >
              {sendOtpMutation.isPending ? "Sending code..." : "Continue"}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <GoogleButton label="Sign up with Google" />

          <div className={styles.footer}>
            Already have an account?{" "}
            <Link href="/login" className={styles.link}>Sign in</Link>
          </div>
        </Card>
      </div>
    );
  }

  // ── Step 2 — OTP verification ──────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.otpIcon}>📧</div>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.subtitle}>
            We sent a 6-digit code to<br />
            <strong>{formData.email}</strong>
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.otpRow} onPaste={handleOtpPaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className={`${styles.otpBox} ${error ? styles.otpBoxError : ""}`}
              aria-label={`Digit ${i + 1}`}
              disabled={registerMutation.isPending}
            />
          ))}
        </div>

        {registerMutation.isPending && (
          <p className={styles.verifying}>Verifying…</p>
        )}

        <div className={styles.resendRow}>
          {resendCountdown > 0 ? (
            <span className={styles.resendTimer}>
              Resend code in {resendCountdown}s
            </span>
          ) : (
            <button
              className={styles.resendBtn}
              onClick={() => {
                setError("");
                setOtp(["", "", "", "", "", ""]);
                sendOtpMutation.mutate();
              }}
              disabled={sendOtpMutation.isPending}
            >
              {sendOtpMutation.isPending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>

        <button
          className={styles.backBtn}
          onClick={() => { setStep("form"); setError(""); setOtp(["", "", "", "", "", ""]); }}
        >
          ← Back to sign up
        </button>
      </Card>
    </div>
  );
}
