import { redirect } from "next/navigation";

import { EMPLOYEES_BASE_PATH } from "@/lib/employee-routes";

export default function WorkspaceNewEmployeeRedirectPage() {
  redirect(`${EMPLOYEES_BASE_PATH}/new`);
}
