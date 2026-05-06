import { redirect } from "next/navigation";

import { HR_SKILL_MATRIX_PATH } from "@/lib/employee-routes";

export default function WorkspaceSkillsMatrixRedirectPage() {
  redirect(HR_SKILL_MATRIX_PATH);
}
