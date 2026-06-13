import { redirect } from "next/navigation";

/** Leads are deprecated and consolidated into Clients. */
export default async function AdminLeadRedirect() {
    redirect("/admin/clients");
}
