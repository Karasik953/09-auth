"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { checkSession, getMe, logout } from "@/lib/api/clientApi";
import { useAuthStore } from "@/lib/store/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const clearIsAuthenticated = useAuthStore((s) => s.clearIsAuthenticated);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const isPrivate = pathname.startsWith("/profile") || pathname.startsWith("/notes");

      try {
        // 1) тільки перевіряємо, чи є активна сесія
        const session = await checkSession();

        if (!session) {
          // немає сесії
          clearIsAuthenticated();

          if (isPrivate) {
            // пробуємо коректно "вийти" (почистити cookies, якщо треба)
            try {
              await logout();
            } catch {
              // ігноруємо
            }
            router.replace("/sign-in");
          }

          return;
        }

        // 2) якщо сесія є — окремо отримуємо повні дані користувача
        const user = await getMe();
        setUser(user);
      } catch {
        clearIsAuthenticated();

        if (isPrivate) {
          try {
            await logout();
          } catch {
            // ігноруємо
          }
          router.replace("/sign-in");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [pathname, router, setUser, clearIsAuthenticated]);

  if (loading) return <p>Loading...</p>;

  return <>{children}</>;
}
