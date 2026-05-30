'use client';

import Link from 'next/link';
import { Callout } from '@radix-ui/themes';
import { useSearchParams } from 'next/navigation';

export default function DocumentSaveNotice({ docType }: { docType: 'invoice' | 'estimate' | 'quote' | 'receipt' }) {
    const searchParams = useSearchParams();
    if (searchParams.get('recorded') !== '1' || docType !== 'invoice') {
        return null;
    }

    const receiptId = searchParams.get('receipt');

    return (
        <Callout.Root color="green" mb="4" className="no-print">
            <Callout.Text>
                Payment recorded and invoice updated.
                {receiptId ? (
                    <>
                        {' '}
                        Receipt{' '}
                        <Link href={`/admin/receipts/${receiptId}`} style={{ fontWeight: 600 }}>
                            {receiptId}
                        </Link>{' '}
                        was created.
                    </>
                ) : null}
            </Callout.Text>
        </Callout.Root>
    );
}
