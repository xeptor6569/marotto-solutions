import { redirect } from "next/navigation";

/** Leads are deprecated and consolidated into Clients. */
export default function LeadsListRedirect() {
    redirect("/admin/clients");
}
