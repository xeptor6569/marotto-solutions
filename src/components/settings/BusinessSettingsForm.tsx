'use client';

import { useMemo } from 'react';
import { Grid, TextArea, TextField, Text, Box } from '@radix-ui/themes';
import SettingsSectionForm, { Field } from './SettingsSectionForm';
import { CURRENCY_OPTIONS } from '@/lib/money';
import { listTimeZones } from '@/lib/timezones';
import type { AppConfig } from '@/lib/types';

export const nativeSelectStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 32,
    padding: '0 10px',
    borderRadius: 'var(--radius-2)',
    border: '1px solid var(--gray-a7)',
    background: 'var(--color-surface)',
    color: 'var(--gray-12)',
    font: 'inherit',
    fontSize: 'var(--font-size-2)',
};

export default function BusinessSettingsForm({ config }: { config: Partial<AppConfig> }) {
    const business = config.business;
    const timeZones = useMemo(() => listTimeZones(), []);
    const currentTimezone = config.businessTimezone || 'America/New_York';
    const currentCurrency = (business?.currency || 'USD').toUpperCase();
    const currencyOptions = CURRENCY_OPTIONS.some((c) => c.code === currentCurrency)
        ? CURRENCY_OPTIONS
        : [{ code: currentCurrency, label: currentCurrency }, ...CURRENCY_OPTIONS];

    return (
        <SettingsSectionForm section="business">
            <Text size="2" color="gray">
                Your business identity appears across the app: the admin header, public site, printed documents, and outgoing email.
            </Text>

            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Field label="Business name" hint="Shown everywhere — navigation, documents, and emails.">
                    <TextField.Root
                        name="businessName"
                        defaultValue={business?.name || ''}
                        placeholder="Acme Contracting"
                        autoComplete="organization"
                    />
                </Field>
                <Field label="Legal name" hint="Used on contract signature lines. Falls back to the business name.">
                    <TextField.Root
                        name="legalName"
                        defaultValue={business?.legalName || ''}
                        placeholder="Acme Contracting LLC"
                    />
                </Field>
            </Grid>

            <Field label="Tagline" hint="A short line about what you do. Used on the public site and in search results.">
                <TextField.Root
                    name="tagline"
                    defaultValue={business?.tagline || ''}
                    placeholder="Quality home repairs and renovations"
                />
            </Field>

            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Field label="Phone (display)" hint='How the number is shown, e.g. "(555) 555-0100".'>
                    <TextField.Root
                        name="phoneDisplay"
                        type="tel"
                        inputMode="tel"
                        defaultValue={business?.phoneDisplay || ''}
                        placeholder="(555) 555-0100"
                    />
                </Field>
                <Field label="Phone (dialing)" hint='Full number for tap-to-call links, e.g. "+15555550100".'>
                    <TextField.Root
                        name="phoneE164"
                        type="tel"
                        inputMode="tel"
                        defaultValue={business?.phoneE164 || ''}
                        placeholder="+15555550100"
                    />
                </Field>
            </Grid>

            <Field label="Contact email" hint="Public contact address; also the fallback From address for outgoing email.">
                <TextField.Root
                    name="businessEmail"
                    type="email"
                    inputMode="email"
                    defaultValue={business?.email || ''}
                    placeholder="office@example.com"
                />
            </Field>

            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Field label="Address line 1">
                    <TextField.Root
                        name="addressLine1"
                        defaultValue={business?.addressLine1 || ''}
                        placeholder="123 Main Street"
                    />
                </Field>
                <Field label="Address line 2">
                    <TextField.Root
                        name="addressLine2"
                        defaultValue={business?.addressLine2 || ''}
                        placeholder="Springfield, ST 00000"
                    />
                </Field>
            </Grid>

            <Field label="Service area" hint="Plain-language description shown on the public site.">
                <TextArea
                    name="serviceArea"
                    defaultValue={business?.serviceArea || ''}
                    placeholder="Springfield and surrounding communities"
                    rows={2}
                />
            </Field>

            <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 16 }}>
                <Text size="3" weight="bold" as="div" mb="3">Region</Text>
                <Grid columns={{ initial: '1', sm: '3' }} gap="4">
                    <Field label="Currency" hint="Used for every amount in the app, on documents, and for card payments.">
                        <select name="currency" defaultValue={currentCurrency} style={nativeSelectStyle}>
                            {currencyOptions.map((option) => (
                                <option key={option.code} value={option.code}>{option.label}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Number format locale" hint='Controls separators and symbol placement, e.g. "en-US", "en-GB", "de-DE".'>
                        <TextField.Root
                            name="locale"
                            defaultValue={business?.locale || 'en-US'}
                            placeholder="en-US"
                        />
                    </Field>
                    <Field label="Business timezone" hint="Calendar times and reminders use this.">
                        <select name="businessTimezone" defaultValue={currentTimezone} style={nativeSelectStyle}>
                            {!timeZones.includes(currentTimezone) ? (
                                <option value={currentTimezone}>{currentTimezone}</option>
                            ) : null}
                            {timeZones.map((zone) => (
                                <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </Field>
                </Grid>
            </Box>
        </SettingsSectionForm>
    );
}
