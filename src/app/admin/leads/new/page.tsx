import { redirect } from "next/navigation";

/** Avoid `[id]` catching the segment `new`; canonical create URL is `/admin/leads/create`. */
export default function LeadNewAliasPage() {
    redirect("/admin/leads/create");
}
