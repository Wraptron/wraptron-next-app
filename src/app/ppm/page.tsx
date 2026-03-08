"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PPMPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /projects
    router.replace("/projects");
  }, [router]);

  return null;
}
