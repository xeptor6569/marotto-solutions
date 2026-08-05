import { notFound } from 'next/navigation';
import DocumentPreview from '@/components/DocumentPreview';
import ContractPreview from '@/components/ContractPreview';
import { getDocumentByShareToken } from '@/lib/data';
import { getContractByShareToken } from '@/lib/contracts';

export default async function SharedDocumentPage({
    params,
    searchParams,
}: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ stripe?: string }>;
}) {
    const { token } = await params;
    const query = await searchParams;
    const trimmed = token?.trim();
    if (!trimmed || trimmed.length < 16) {
        notFound();
    }

    const stripeReturn =
        query.stripe === 'success' || query.stripe === 'cancelled' ? query.stripe : null;

    const doc = await getDocumentByShareToken(trimmed);
    if (doc) {
        return <DocumentPreview doc={doc} publicMode stripeReturn={stripeReturn} />;
    }

    const contract = await getContractByShareToken(trimmed);
    if (contract) {
        return <ContractPreview contract={contract} publicMode />;
    }

    notFound();
}
