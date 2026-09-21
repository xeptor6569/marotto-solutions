import { redirect } from 'next/navigation';

// Settings live in the admin shell; this legacy route just forwards there.
export default function LegacySettingsPage() {
    redirect('/admin/settings');
}
