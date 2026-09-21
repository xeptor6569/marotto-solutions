'use client';

import { Box, Tabs } from '@radix-ui/themes';
import BusinessSettingsForm from './BusinessSettingsForm';
import AppearanceSettingsForm from './AppearanceSettingsForm';
import PublicSiteSettingsForm from './PublicSiteSettingsForm';
import BillingSettingsForm from './BillingSettingsForm';
import DocumentsSettingsForm from './DocumentsSettingsForm';
import StorageSettingsForm from './StorageSettingsForm';
import AccountSettingsForm from './AccountSettingsForm';
import type { AppConfig } from '@/lib/types';
import type { SettingsTabId } from '@/lib/settings-tabs';

export default function SettingsTabs({
    config,
    logoUrl,
    defaultTab = 'business',
    account,
}: {
    config: Partial<AppConfig>;
    logoUrl: string | null;
    defaultTab?: SettingsTabId;
    account?: { email: string; hasPassword: boolean };
}) {
    return (
        <Tabs.Root defaultValue={defaultTab}>
            <Box style={{ overflowX: 'auto' }}>
                <Tabs.List>
                    <Tabs.Trigger value="business">Business</Tabs.Trigger>
                    <Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
                    <Tabs.Trigger value="site">Public Site</Tabs.Trigger>
                    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
                    <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
                    <Tabs.Trigger value="storage">Storage</Tabs.Trigger>
                    {account ? <Tabs.Trigger value="account">Account</Tabs.Trigger> : null}
                </Tabs.List>
            </Box>

            <Box pt="4">
                <Tabs.Content value="business">
                    <BusinessSettingsForm config={config} />
                </Tabs.Content>
                <Tabs.Content value="appearance">
                    <AppearanceSettingsForm config={config} logoUrl={logoUrl} />
                </Tabs.Content>
                <Tabs.Content value="site">
                    <PublicSiteSettingsForm config={config} />
                </Tabs.Content>
                <Tabs.Content value="billing">
                    <BillingSettingsForm config={config} />
                </Tabs.Content>
                <Tabs.Content value="documents">
                    <DocumentsSettingsForm config={config} />
                </Tabs.Content>
                <Tabs.Content value="storage">
                    <StorageSettingsForm config={config} />
                </Tabs.Content>
                {account ? (
                    <Tabs.Content value="account">
                        <AccountSettingsForm email={account.email} hasPassword={account.hasPassword} />
                    </Tabs.Content>
                ) : null}
            </Box>
        </Tabs.Root>
    );
}
