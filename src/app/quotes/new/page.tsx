import { redirect } from "next/navigation";

/** Legacy entry point; the admin editor is the only document editor. */
export default function LegacyQuoteNewPage() {
    redirect("/admin/quotes/new");
}
