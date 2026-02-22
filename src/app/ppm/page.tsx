"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PPMPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /ppm/projects
    router.replace("/ppm/projects");
  }, [router]);

  return null;
}
