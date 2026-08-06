// Shared between the server settings page (URL parsing) and the client tabs
// component — must stay free of 'use client' so the server can call it.

export type SettingsTabId = 'business' | 'appearance' | 'site' | 'billing' | 'documents' | 'storage';

const VALID_TABS: SettingsTabId[] = ['business', 'appearance', 'site', 'billing', 'documents', 'storage'];

export function parseSettingsTab(raw: string | undefined): SettingsTabId {
    return VALID_TABS.includes(raw as SettingsTabId) ? (raw as SettingsTabId) : 'business';
}
