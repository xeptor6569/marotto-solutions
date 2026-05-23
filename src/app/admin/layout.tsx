import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin?callbackUrl=/admin");
    }

    return <AdminShell userEmail={session.user?.email ?? ""}>{children}</AdminShell>;
}
