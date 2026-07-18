import { notFound } from 'next/navigation';
import ContractPreview from '@/components/ContractPreview';
import { getContractByDisplayId } from '@/lib/contracts';
import { requireAdminSession } from '@/lib/require-admin-session';

export default async function ContractPublicPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminSession();

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
