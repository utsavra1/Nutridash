"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";

export default function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { setUser, accessToken, hasHydrated } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: usersApi.getMe,
    enabled: hasHydrated && !!accessToken,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  return <>{children}</>;
}
