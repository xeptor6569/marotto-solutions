import { redirect } from 'next/navigation';
import { docsHref } from '@/lib/docs';
import { getDocsRequestContext } from '@/lib/docs-server';

export default async function ManualIndexRoute() {
    const { base } = await getDocsRequestContext();
    redirect(docsHref(base, undefined, '#user-manual'));
}
