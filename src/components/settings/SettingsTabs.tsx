'use client';

import { Box, Tabs } from '@radix-ui/themes';
import BusinessSettingsForm from './BusinessSettingsForm';
import AppearanceSettingsForm from './AppearanceSettingsForm';
import PublicSiteSettingsForm from './PublicSiteSettingsForm';
import BillingSettingsForm from './BillingSettingsForm';
import DocumentsSettingsForm from './DocumentsSettingsForm';
import StorageSettingsForm from './StorageSettingsForm';
import type { AppConfig } from '@/lib/types';

export type SettingsTabId = 'business' | 'appearance' | 'site' | 'billing' | 'documents' | 'storage';

const VALID_TABS: SettingsTabId[] = ['business', 'appearance', 'site', 'billing', 'documents', 'storage'];

export function parseSettingsTab(raw: string | undefined): SettingsTabId {
    return VALID_TABS.includes(raw as SettingsTabId) ? (raw as SettingsTabId) : 'business';
}

export default function SettingsTabs({
    config,
    logoUrl,
    defaultTab = 'business',
}: {
    config: Partial<AppConfig>;
    logoUrl: string | null;
    defaultTab?: SettingsTabId;
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
            </Box>
        </Tabs.Root>
    );
}
