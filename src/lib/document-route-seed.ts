export type DocumentRouteSeedParams = {
    jobId?: string;
    clientId?: string;
    redirectTo?: string;
};

export type DocumentFormSeed = {
    jobId?: string;
    clientId?: string;
};

/**
 * Parse create/edit searchParams for job-scoped document flows.
 * Only allows same-origin relative redirect paths under /admin.
 */
export function parseDocumentRouteSeed(
    params: DocumentRouteSeedParams | Record<string, string | string[] | undefined> | undefined,
): {
    seed?: DocumentFormSeed;
    redirectTo?: string;
} {
    if (!params) return {};

    const jobId = firstString(params.jobId)?.trim() || undefined;
    const clientId = firstString(params.clientId)?.trim() || undefined;
    const redirectRaw = firstString(params.redirectTo)?.trim() || undefined;

    const seed =
        jobId || clientId
            ? {
                  ...(jobId ? { jobId } : {}),
                  ...(clientId ? { clientId } : {}),
              }
            : undefined;

    const redirectTo = sanitizeAdminRedirect(redirectRaw);

    return { seed, redirectTo };
}

export function buildDocumentInitialFromSeed(seed?: DocumentFormSeed) {
    if (!seed?.jobId && !seed?.clientId) return undefined;
    return {
        jobId: seed.jobId,
        customer: {
            name: '',
            clientId: seed.clientId,
            jobId: seed.jobId,
        },
    };
}

function firstString(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}

function sanitizeAdminRedirect(value?: string): string | undefined {
    if (!value) return undefined;
    if (!value.startsWith('/')) return undefined;
    if (value.startsWith('//')) return undefined;
    if (!value.startsWith('/admin')) return undefined;
    return value;
}
