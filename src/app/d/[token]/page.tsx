import { notFound } from 'next/navigation';
import DocumentPreview from '@/components/DocumentPreview';
import ContractPreview from '@/components/ContractPreview';
import { getDocumentByShareToken } from '@/lib/data';
import { getContractByShareToken } from '@/lib/contracts';

export default async function SharedDocumentPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const trimmed = token?.trim();
    if (!trimmed || trimmed.length < 16) {
        notFound();
    }

    const doc = await getDocumentByShareToken(trimmed);
    if (doc) {
        return <DocumentPreview doc={doc} publicMode />;
    }

    const contract = await getContractByShareToken(trimmed);
    if (contract) {
        return <ContractPreview contract={contract} publicMode />;
    }

    notFound();
}
