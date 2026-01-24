"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";

export default function Dashboard() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Dashboard");
    return () => setTitle(null);
  }, [setTitle]);

  return <div>Dashboard</div>;
}
