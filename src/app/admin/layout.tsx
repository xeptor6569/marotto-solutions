import AdminShell from "@/components/AdminShell";
import { getBranding } from "@/lib/branding";
import { requireAdminPage } from "@/lib/require-admin-session";
import type { Metadata } from "next";

// Absolute short title so Add-to-Home-Screen / Spotlight do not pick up
// the full marketing title from the public default.
export async function generateMetadata(): Promise<Metadata> {
    const { business } = await getBranding();
    const shortName = business.name.split(/\s+/)[0] || business.name;
    return {
        title: {
            absolute: shortName,
        },
        applicationName: shortName,
        appleWebApp: {
            capable: true,
            statusBarStyle: "black-translucent",
            title: shortName,
        },
    };
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await requireAdminPage("/admin");
    const { business, branding } = await getBranding();

    return (
        <AdminShell
            userEmail={session.user?.email ?? ""}
            businessName={business.name}
            logoUrl={branding.logoUrl}
        >
            {children}
        </AdminShell>
    );
}
