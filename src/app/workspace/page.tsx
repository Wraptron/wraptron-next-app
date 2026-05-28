import { redirect } from "next/navigation";

/** Workspace hub: operational tools (HR directory and skill matrix live under `/hr/...`). */
export default function WorkspacePage() {
  redirect("/workspace/dashboard");
}
