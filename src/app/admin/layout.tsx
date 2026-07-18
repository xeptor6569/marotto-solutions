import AdminShell from "@/components/AdminShell";
import { requireAdminPage } from "@/lib/require-admin-session";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await requireAdminPage("/admin");

    return <AdminShell userEmail={session.user?.email ?? ""}>{children}</AdminShell>;
}
