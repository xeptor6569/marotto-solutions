import type { DocumentFormMode } from '@/lib/types';

export const DEFAULT_DOCUMENT_FORM_MODE: DocumentFormMode = 'guided';

export function parseDocumentFormMode(raw: unknown): DocumentFormMode {
    return raw === 'full' ? 'full' : 'guided';
}
