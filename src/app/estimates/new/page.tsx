import { redirect } from "next/navigation";

/** Legacy entry point; the admin editor is the only document editor. */
export default function LegacyEstimateNewPage() {
    redirect("/admin/estimates/new");
}
