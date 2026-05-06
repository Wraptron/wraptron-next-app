import { redirect } from "next/navigation";

import { EMPLOYEES_BASE_PATH } from "@/lib/employee-routes";

type Props = { params: Promise<{ id: string }> };

export default async function WorkspaceEditEmployeeRedirectPage({
  params,
}: Props) {
  const { id } = await params;
  redirect(`${EMPLOYEES_BASE_PATH}/${id}/edit`);
}
