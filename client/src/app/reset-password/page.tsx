"use client";
import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../lib/api";
import Link from "next/link";
import styles from "./page.module.css";
import { Card } from "../../components/Card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const resetMutation = useMutation({
    mutationFn: () =>
      authApi.resetPassword({ email, otp: otp.join(""), newPassword }),
    onSuccess: () => setSuccess(true),
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Invalid or expired code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => {
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setError("");
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.join("").length < 6) { setError("Please enter the full 6-digit code."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    resetMutation.mutate();
  };

  if (success) {
    return (
      <div className={styles.pageContainer}>
        <Card className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.successTitle}>Password reset!</h1>
          <p className={styles.successMessage}>
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <Link href="/login" className={styles.successBtn}>Sign in now</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Reset password</h1>
          <p className={styles.subtitle}>
            Enter the code sent to{" "}
            <span className={styles.emailHighlight}>{email}</span>{" "}
            and choose a new password
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Verification code</label>
            <div className={styles.otpRow} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={styles.otpBox}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <div className={styles.resendRow}>
              Didn't get a code?{" "}
              <button
                type="button"
                className={styles.resendBtn}
                onClick={() => resendMutation.mutate()}
                disabled={resendCooldown > 0 || resendMutation.isPending}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendMutation.isPending ? "Sending..." : "Resend"}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              required
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
            />
          </div>

          <button type="submit" disabled={resetMutation.isPending} className={styles.submitButton}>
            {resetMutation.isPending ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/login" className={styles.link}>← Back to sign in</Link>
        </div>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280" }}>Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
