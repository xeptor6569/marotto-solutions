import { requireAdminPage } from '@/lib/require-admin-session';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
    await requireAdminPage('/settings');
    return children;
}
