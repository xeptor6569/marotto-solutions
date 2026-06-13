import { redirect } from "next/navigation";

/** Leads are deprecated; client creation now lives under /admin/clients. */
export default function CreateLeadRedirect() {
    redirect("/admin/clients/create");
}
