"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../../../stores/auth-store";

function Spinner() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1rem",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: "4px solid #e5e7eb",
        borderTopColor: "#10b981",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: "1rem", color: "#6b7280" }}>Signing you in with Google…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setAccessToken } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const id = searchParams.get("userId");
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const role = searchParams.get("role");
    const isOnboardingComplete = searchParams.get("isOnboardingComplete") === "true";

    console.log("🔑 Google callback params:", { accessToken: !!accessToken, id, name, email, role, isOnboardingComplete });

    if (!accessToken || !id || !name || !email || !role) {
      console.error("❌ Missing params in Google callback, redirecting to login");
      router.replace("/login?error=google_failed");
      return;
    }

    setUser({ id, name, email, role: role as any, isOnboardingComplete });
    setAccessToken(accessToken);

    if (role === "SUPER_ADMIN") {
      router.replace("/super-admin");
    } else if (role === "RESTAURANT_ADMIN") {
      router.replace("/admin");
    } else if (!isOnboardingComplete) {
      router.replace("/onboarding/health-profile");
    } else {
      router.replace("/");
    }
  }, [searchParams, router, setUser, setAccessToken]);

  return <Spinner />;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <GoogleCallbackHandler />
    </Suspense>
  );
}
