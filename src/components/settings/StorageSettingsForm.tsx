'use client';

import { Text, TextField } from '@radix-ui/themes';
import SettingsSectionForm, { Field } from './SettingsSectionForm';
import type { AppConfig } from '@/lib/types';

export default function StorageSettingsForm({ config }: { config: Partial<AppConfig> }) {
    return (
        <SettingsSectionForm section="storage">
            <Text size="2" color="gray">
                Documents (invoices, estimates, quotes, receipts) are stored as JSON files. Leave WebDAV empty to keep
                them on this server&apos;s local <code>data/</code> volume, or connect Nextcloud/WebDAV to store them remotely.
            </Text>

            <Field
                label="Nextcloud WebDAV URL"
                help="In Nextcloud: Files → Settings (bottom left) → WebDAV. Any WebDAV server works. When set, documents are read from and saved to that server instead of this one."
                helpTopic="storage-backups"
            >
                <TextField.Root
                    name="webdavUrl"
                    defaultValue={config.webdavUrl || ''}
                    placeholder="https://cloud.example.com/remote.php/dav/files/myname/"
                    inputMode="url"
                />
            </Field>
            <Field label="Username">
                <TextField.Root
                    name="webdavUsername"
                    defaultValue={config.webdavUsername || ''}
                    autoComplete="off"
                />
            </Field>
            <Field
                label="Password / App Token"
                help="Use an app password (Nextcloud: Personal settings → Security → Create new app password) rather than your main password, so you can revoke it on its own."
            >
                <TextField.Root
                    name="webdavPassword"
                    type="password"
                    defaultValue={config.webdavPassword || ''}
                    autoComplete="new-password"
                />
            </Field>
            <Field
                label="Remote folder"
                hint="Folder on the WebDAV server where documents are kept. Changing this does not move existing files."
                help="To move documents to a new folder or server: take a backup, change the storage settings, then restore the backup."
                helpTopic="storage-backups"
            >
                <TextField.Root
                    name="webdavRootPath"
                    defaultValue={config.webdavRootPath || ''}
                    placeholder="/BusinessData"
                    style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
                />
            </Field>
        </SettingsSectionForm>
    );
}
