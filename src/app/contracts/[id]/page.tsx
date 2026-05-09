import { notFound } from 'next/navigation';
import ContractPreview from '@/components/ContractPreview';
import { getContractByDisplayId } from '@/lib/contracts';

export default async function ContractPublicPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const contract = await getContractByDisplayId(id);
    if (!contract) {
        notFound();
    }
    return (
        <ContractPreview
            contract={contract}
            showBackButton
            backHref="/"
        />
    );
}
