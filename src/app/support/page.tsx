"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";

export default function Support() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Support");
    return () => setTitle(null);
  }, [setTitle]);

  return <div>Support</div>;
}
