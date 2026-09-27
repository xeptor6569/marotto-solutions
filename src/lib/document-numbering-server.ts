import { getAppConfig } from './config';
import { resolveNumbering, type ResolvedNumbering } from './document-numbering';

/** Configured prefixes/start numbers/padding for server-side ID generation. */
export async function getDocumentNumbering(): Promise<ResolvedNumbering> {
    const config = await getAppConfig();
    return resolveNumbering(config.numbering);
}
