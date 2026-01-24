"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";

export default function Payments() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Billing");
    return () => setTitle(null);
  }, [setTitle]);

  return <div>Payments</div>;
}
