"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * The admin login UI lives in the admin layout's auth gate (shown whenever the
 * visitor isn't an authenticated operator). Once authenticated, this route just
 * forwards to the overview.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <img src="/favicon.ico" alt="WeWash" className="h-10 w-10 animate-pulse object-contain" />
    </div>
  );
}
