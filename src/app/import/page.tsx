import { redirect } from 'next/navigation';

// Import lives in the admin shell; this legacy route just forwards there.
export default function LegacyImportPage() {
    redirect('/admin/import');
}
