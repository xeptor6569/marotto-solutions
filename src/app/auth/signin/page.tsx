import { redirect } from 'next/navigation';
import { getBranding } from '@/lib/branding';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import SignInForm from './signin-form';

export default async function SignInPage() {
    // A fresh install with no accounts goes to the first-run wizard instead.
    if (isDatabaseConfigured()) {
        let userCount: number | null = null;
        try {
            userCount = await prisma.user.count();
        } catch {
            // Database unreachable — the sign-in form still renders and any
            // attempt will surface the real error.
        }
        if (userCount === 0) redirect('/setup');
    }

    const { business, branding } = await getBranding();

    return <SignInForm businessName={business.name} logoUrl={branding.logoUrl} />;
}
