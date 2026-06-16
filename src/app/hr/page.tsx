import { redirect } from "next/navigation";

import { HR_DASHBOARD_PATH } from "@/lib/employee-routes";

export default function HumanResourcesPage() {
  redirect(HR_DASHBOARD_PATH);
}
