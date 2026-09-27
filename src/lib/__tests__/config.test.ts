import { describe, expect, it } from 'vitest';
import { DEFAULT_WEBDAV_ROOT_PATH, mergeAppConfig } from '@/lib/config';
import {
    LEGACY_BUSINESS,
    LEGACY_WEBDAV_ROOT_PATH,
} from '@/lib/legacy-defaults';

describe('mergeAppConfig', () => {
    it('fresh install (no settings file) gets neutral defaults', () => {
        const config = mergeAppConfig(null);
        expect(config.business?.name).toBe('');
        expect(config.branding?.themePreset).toBe('classic-indigo');
        expect(config.branding?.defaultAppearance).toBe('system');
        expect(config.publicSite?.enabled).toBe(true);
        expect(config.publicSite?.services).toEqual([]);
        expect(config.webdavRootPath).toBe(DEFAULT_WEBDAV_ROOT_PATH);
        expect(config.billing?.paymentMethods.cash.enabled).toBe(true);
    });

    it('pre-white-label install (file without business) is seeded with legacy branding', () => {
        const config = mergeAppConfig({
            webdavUrl: 'https://cloud.example.com/dav',
            webdavUsername: 'user',
        });
        expect(config.business?.name).toBe(LEGACY_BUSINESS.name);
        expect(config.business?.phoneDisplay).toBe(LEGACY_BUSINESS.phoneDisplay);
        expect(config.branding?.letterheadLine1).toBe('MAROTTO');
        expect(config.publicSite?.services?.length).toBeGreaterThan(0);
        expect(config.webdavRootPath).toBe(LEGACY_WEBDAV_ROOT_PATH);
        // Existing operational settings survive the seed.
        expect(config.webdavUrl).toBe('https://cloud.example.com/dav');
    });

    it('post-white-label install keeps its own business values (no legacy seeding)', () => {
        const config = mergeAppConfig({
            business: { name: 'Acme Plumbing' },
        });
        expect(config.business?.name).toBe('Acme Plumbing');
        expect(config.business?.phoneDisplay).toBe('');
        expect(config.publicSite?.services).toEqual([]);
        expect(config.webdavRootPath).toBe(DEFAULT_WEBDAV_ROOT_PATH);
    });

    it('an intentionally cleared business name is not re-seeded', () => {
        const config = mergeAppConfig({ business: { name: '' } });
        expect(config.business?.name).toBe('');
    });

    it('explicit webdavRootPath wins over both defaults', () => {
        const config = mergeAppConfig({
            business: { name: 'Acme' },
            webdavRootPath: '/CustomRoot',
        });
        expect(config.webdavRootPath).toBe('/CustomRoot');
    });
});
