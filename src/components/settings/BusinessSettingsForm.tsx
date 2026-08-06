'use client';

import { Grid, TextArea, TextField, Text, Box } from '@radix-ui/themes';
import SettingsSectionForm, { Field } from './SettingsSectionForm';
import type { AppConfig } from '@/lib/types';

export default function BusinessSettingsForm({ config }: { config: Partial<AppConfig> }) {
    const business = config.business;

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

            <Box>
                <Field label="Business timezone" hint="IANA identifier (e.g. America/New_York). Calendar times and reminders use this.">
                    <TextField.Root
                        name="businessTimezone"
                        defaultValue={config.businessTimezone || 'America/New_York'}
                        placeholder="America/New_York"
                    />
                </Field>
            </Box>
        </SettingsSectionForm>
    );
}
