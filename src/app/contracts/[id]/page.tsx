import ContractPreview from '@/components/ContractPreview';
import { resolveLegacyContractShare } from '@/lib/legacy-share-redirect';

export default async function ContractPublicPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const contract = await resolveLegacyContractShare(id);
    return (
        <ContractPreview
            contract={contract}
            showBackButton
            backHref="/"
        />
    );
}
