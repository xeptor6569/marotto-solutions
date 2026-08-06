/**
 * Which deployment this process is: production, or a non-production instance
 * such as dev.marottosolutions.com.
 *
 * Deliberately separate from NODE_ENV. The dev stack runs a production Next.js
 * build (NODE_ENV=production) so it behaves like prod; APP_ENV is what tells
 * the app it is not serving real clients.
 */
export type AppEnv = 'production' | 'dev' | 'local';

export function getAppEnv(): AppEnv {
    const raw = process.env.APP_ENV?.trim().toLowerCase();
    if (raw === 'dev' || raw === 'development' || raw === 'staging') return 'dev';
    if (raw === 'local') return 'local';
    if (raw === 'production' || raw === 'prod') return 'production';
    // No explicit APP_ENV: fall back to NODE_ENV so `npm run dev` is treated as
    // a non-production instance without extra setup.
    return process.env.NODE_ENV === 'production' ? 'production' : 'local';
}

export function isProductionEnvironment(): boolean {
    return getAppEnv() === 'production';
}

/** True on any instance that must not be treated as serving real clients. */
export function isNonProductionEnvironment(): boolean {
    return !isProductionEnvironment();
}

/** Short label for the environment banner. Null in production. */
export function getEnvironmentLabel(): string | null {
    switch (getAppEnv()) {
        case 'dev':
            return 'DEV';
        case 'local':
            return 'LOCAL';
        default:
            return null;
    }
}
