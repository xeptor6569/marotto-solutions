import { requireAdminPage } from '@/lib/require-admin-session';

export default async function ImportLayout({ children }: { children: React.ReactNode }) {
    await requireAdminPage('/import');
    return children;
}
