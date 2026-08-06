import { getBranding } from '@/lib/branding';
import SignInForm from './signin-form';

export default async function SignInPage() {
    const { business, branding } = await getBranding();

    return <SignInForm businessName={business.name} logoUrl={branding.logoUrl} />;
}
