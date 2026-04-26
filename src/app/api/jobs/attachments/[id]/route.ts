import { NextResponse } from 'next/server';
import { getJobAttachmentById, readAttachmentBinary } from '@/lib/job-attachments';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const attachment = await getJobAttachmentById(id);
    if (!attachment) {
        return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }
    try {
        const binary = await readAttachmentBinary(attachment.storagePath);
        const headers = new Headers();
        headers.set('Content-Type', attachment.mimeType);
        headers.set('Content-Length', String(binary.length));
        headers.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
        return new NextResponse(new Uint8Array(binary), { status: 200, headers });
    } catch {
        return NextResponse.json({ error: 'Unable to read attachment' }, { status: 500 });
    }
}
