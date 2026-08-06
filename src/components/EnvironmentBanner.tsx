import { getEnvironmentLabel } from '@/lib/app-env';

/**
 * Corner badge marking a non-production instance. Dev and prod render an
 * identical UI over near-identical data, so without this it is easy to edit a
 * real invoice while believing you are on dev. Renders nothing in production.
 */
export function EnvironmentBanner() {
    const label = getEnvironmentLabel();
    if (!label) return null;

    return (
        <div className="env-banner no-print" aria-hidden="false">
            <span className="env-banner-dot" />
            {label}
        </div>
    );
}
