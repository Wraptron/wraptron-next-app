import { redirect } from "next/navigation";

/** `/product` → catalog */
export default function ProductIndexPage() {
  redirect("/products");
}
