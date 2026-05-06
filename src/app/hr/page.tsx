import { redirect } from "next/navigation";

import { EMPLOYEES_BASE_PATH } from "@/lib/employee-routes";

export default function HumanResourcesPage() {
  redirect(EMPLOYEES_BASE_PATH);
}
