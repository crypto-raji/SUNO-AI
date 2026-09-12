"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthRedirect({ to = "/login" }: { to?: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 text-xs text-paper-300">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-signal animate-ping" />
        <span>Redirecting to login…</span>
      </div>
    </div>
  );
}
