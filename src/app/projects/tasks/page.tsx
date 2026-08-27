"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LegacyProjectsTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(`/tasks${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return null;
}
