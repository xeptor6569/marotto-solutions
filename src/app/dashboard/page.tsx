import { redirect } from 'next/navigation';

// The legacy operations dashboard is superseded by the admin dashboard.
export default function LegacyDashboardPage() {
    redirect('/admin');
}
