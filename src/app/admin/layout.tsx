import AdminShell from "@/components/AdminShell";
import { requireAdminPage } from "@/lib/require-admin-session";
import type { Metadata } from "next";

// Absolute title so Add-to-Home-Screen / Spotlight do not pick up
// "Marotto Solutions" from the marketing default.
export const metadata: Metadata = {
    title: {
        absolute: "Marotto",
    },
    applicationName: "Marotto",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Marotto",
    },
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await requireAdminPage("/admin");

    return <AdminShell userEmail={session.user?.email ?? ""}>{children}</AdminShell>;
}
