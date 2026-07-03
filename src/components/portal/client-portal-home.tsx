"use client";

import { FeaturedProjectBanner } from "@/components/portal/featured-project-banner";
import { UserDashboardCatalog } from "@/components/user-dashboard-catalog";

export function ClientPortalHome() {
  return (
    <div className="space-y-8">
      <FeaturedProjectBanner />
      <UserDashboardCatalog showFeatured={false} />
    </div>
  );
}
