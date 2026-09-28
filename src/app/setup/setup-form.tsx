'use client';

import { useActionState, useState, useSyncExternalStore } from 'react';
import { Box, Button, Callout, Card, Flex, Grid, Heading, Text, TextField } from '@radix-ui/themes';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Rocket } from 'lucide-react';
import { completeSetupAction, type SetupActionState, type SetupStep } from './actions';
import { CURRENCY_OPTIONS } from '@/lib/money';
import { getThemePreset, resolveTheme } from '@/lib/theme-presets';
import { getLook, LOOKS, type LookId } from '@/lib/theme-looks';
import LookPicker from '@/components/theme/LookPicker';
import ColorPresetPicker from '@/components/theme/ColorPresetPicker';
import ThemePreview from '@/components/theme/ThemePreview';
import { resolveBusiness, resolveLetterhead } from '@/lib/branding-core';

const initialState: SetupActionState = {};

const STEPS: { id: SetupStep; label: string; title: string; description: string }[] = [
    { id: 'account', label: 'Account', title: 'Create your admin account', description: 'You will sign in with this email and password.' },
    { id: 'business', label: 'Business', title: 'Tell us about your business', description: 'This appears on your documents and client pages. You can fill in the rest later.' },
    { id: 'look', label: 'Look', title: 'Pick a look', description: 'Type, shape, and color for the app, client pages, and paperwork. Changeable any time.' },
    { id: 'review', label: 'Review', title: 'Ready to go', description: 'Check the details, then create your workspace.' },
];

function detectTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
    return (
        <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium" htmlFor={htmlFor}>{label}</Text>
            {children}
            {hint ? <Text size="1" color="gray">{hint}</Text> : null}
        </Flex>
    );
}

export default function SetupForm({ timeZones }: { timeZones: string[] }) {
    const [state, formAction, isPending] = useActionState(completeSetupAction, initialState);
    const [step, setStep] = useState<SetupStep>('account');
    const [stepError, setStepError] = useState('');

    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [businessEmail, setBusinessEmail] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [logoName, setLogoName] = useState('');
    const [lookId, setLookId] = useState<LookId>('studio');
    const [presetId, setPresetId] = useState('classic-indigo');

    // Server renders UTC; the browser's zone takes over on hydration without a mismatch.
    const detectedTimeZone = useSyncExternalStore(() => () => {}, detectTimeZone, () => 'UTC');
    const [chosenTimeZone, setTimeZone] = useState<string | null>(null);
    const timeZone = chosenTimeZone ?? detectedTimeZone;
    const zoneOptions = timeZones.includes(timeZone) ? timeZones : [timeZone, ...timeZones];

    // A server-side validation error sends the admin back to the step that needs fixing.
    const [handledState, setHandledState] = useState(state);
    if (handledState !== state) {
        setHandledState(state);
        if (state.step) setStep(state.step);
    }

    const stepIndex = STEPS.findIndex((s) => s.id === step);
    const current = STEPS[stepIndex];
    const preview = resolveTheme({ themePreset: presetId, look: lookId });
    const business = resolveBusiness({ name: businessName || 'Your Business' });

    const validate = (target: SetupStep): string => {
        if (target === 'account') {
            if (!/^\S+@\S+\.\S+$/.test(adminEmail.trim())) return 'Enter a valid email address.';
            if (password.length < 8) return 'Use at least 8 characters for the password.';
            if (password !== confirm) return 'The passwords do not match.';
        }
        if (target === 'business' && !businessName.trim()) return 'Enter your business name.';
        return '';
    };

    const goNext = () => {
        const problem = validate(step);
        setStepError(problem);
        if (!problem) {
            setStep(STEPS[stepIndex + 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goTo = (target: SetupStep) => {
        const targetIndex = STEPS.findIndex((s) => s.id === target);
        // Only allow jumping forward past steps that validate.
        for (let i = 0; i < targetIndex; i++) {
            const problem = validate(STEPS[i].id);
            if (problem) {
                setStep(STEPS[i].id);
                setStepError(problem);
                return;
            }
        }
        setStepError('');
        setStep(target);
    };

    const chooseLook = (next: LookId) => {
        setLookId(next);
        const look = getLook(next);
        if (look) setPresetId(look.suggestedPresetId);
    };

    const error = stepError || state.error;

    return (
        <form
            action={formAction}
            className="setup-form"
            data-step={step}
            onSubmit={(event) => {
                // Enter on an earlier step means "continue", not "create the workspace".
                if (step !== 'review') {
                    event.preventDefault();
                    goNext();
                }
            }}
        >
            <ol className="setup-steps" aria-label="Setup progress">
                {STEPS.map((s, i) => (
                    <li key={s.id}>
                        <button
                            type="button"
                            className="setup-step"
                            data-active={s.id === step || undefined}
                            data-complete={i < stepIndex || undefined}
                            onClick={() => goTo(s.id)}
                            aria-current={s.id === step ? 'step' : undefined}
                        >
                            <span className="setup-step-dot">{i < stepIndex ? <Check size={12} /> : i + 1}</span>
                            <span className="setup-step-label">{s.label}</span>
                        </button>
                    </li>
                ))}
            </ol>

            <Box mb="5" className="setup-heading">
                <span className="ui-eyebrow">Step {stepIndex + 1} of {STEPS.length}</span>
                <Heading size="7" mt="1">{current.title}</Heading>
                <Text as="p" size="3" color="gray" mt="1">{current.description}</Text>
            </Box>

            {error ? (
                <Callout.Root color="red" mb="4">
                    <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            ) : null}

            <div className="setup-panel" data-panel="account">
                <Card size="3">
                    <Flex direction="column" gap="4">
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Field label="Your name" htmlFor="setup-name">
                                <TextField.Root id="setup-name" name="adminName" size="3" placeholder="Alex Smith" autoComplete="name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                            </Field>
                            <Field label="Email" htmlFor="setup-email">
                                <TextField.Root id="setup-email" name="adminEmail" size="3" type="email" inputMode="email" placeholder="you@example.com" autoComplete="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                            </Field>
                        </Grid>
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Field label="Password" hint="At least 8 characters." htmlFor="setup-password">
                                <TextField.Root id="setup-password" name="adminPassword" size="3" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </Field>
                            <Field label="Confirm password" htmlFor="setup-confirm">
                                <TextField.Root id="setup-confirm" name="adminPasswordConfirm" size="3" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                            </Field>
                        </Grid>
                    </Flex>
                </Card>
            </div>

            <div className="setup-panel" data-panel="business">
                <Card size="3">
                    <Flex direction="column" gap="4">
                        <Field label="Business name" htmlFor="setup-business">
                            <TextField.Root id="setup-business" name="businessName" size="3" placeholder="Acme Contracting" autoComplete="organization" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                        </Field>
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Field label="Phone (optional)" htmlFor="setup-phone">
                                <TextField.Root id="setup-phone" name="phoneDisplay" size="3" type="tel" inputMode="tel" placeholder="(555) 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </Field>
                            <Field label="Contact email (optional)" htmlFor="setup-business-email">
                                <TextField.Root id="setup-business-email" name="businessEmail" size="3" type="email" inputMode="email" placeholder="office@example.com" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
                            </Field>
                        </Grid>
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Field label="Currency" hint="Used for every amount and for card payments." htmlFor="setup-currency">
                                <select id="setup-currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="setup-select">
                                    {CURRENCY_OPTIONS.map((option) => (
                                        <option key={option.code} value={option.code}>{option.label}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Timezone" hint="Detected from this device; calendar times use it." htmlFor="setup-timezone">
                                <select id="setup-timezone" name="businessTimezone" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className="setup-select">
                                    {zoneOptions.map((zone) => (
                                        <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </Field>
                        </Grid>
                        <Field label="Logo (optional)" hint="PNG, JPEG, WebP, SVG, or GIF up to 2MB. Shown in the header, on client pages, and optionally on documents." htmlFor="setup-logo">
                            <input
                                id="setup-logo"
                                type="file"
                                name="logoFile"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                                onChange={(e) => setLogoName(e.target.files?.[0]?.name ?? '')}
                            />
                        </Field>
                    </Flex>
                </Card>
            </div>

            <div className="setup-panel" data-panel="look">
                <div className="setup-look-layout">
                    <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
                        <LookPicker value={lookId} onChange={chooseLook} accentColor={preview.accentColor} grayColor={preview.grayColor} />
                        <Box>
                            <Text as="div" size="2" weight="medium" mb="2">Color</Text>
                            <ColorPresetPicker value={presetId} onChange={setPresetId} allowCustom={false} />
                        </Box>
                    </Flex>
                    <aside className="setup-look-preview">
                        <ThemePreview
                            settings={preview}
                            businessName={business.name}
                            letterhead={resolveLetterhead(undefined, business)}
                        />
                    </aside>
                </div>
            </div>

            <div className="setup-panel" data-panel="review">
                <Card size="3">
                    <dl className="setup-review">
                        <div><dt>Admin</dt><dd>{adminName ? `${adminName} · ` : ''}{adminEmail}</dd></div>
                        <div><dt>Business</dt><dd>{businessName}{phone ? ` · ${phone}` : ''}{businessEmail ? ` · ${businessEmail}` : ''}</dd></div>
                        <div><dt>Currency & timezone</dt><dd>{currency} · {timeZone.replace(/_/g, ' ')}</dd></div>
                        <div><dt>Logo</dt><dd>{logoName || 'None yet'}</dd></div>
                        <div>
                            <dt>Look</dt>
                            <dd>{LOOKS.find((l) => l.id === lookId)?.label} · {getThemePreset(presetId)?.label}</dd>
                        </div>
                    </dl>
                    <Text as="p" size="2" color="gray" mt="3">
                        Next you&apos;ll land on your dashboard with a short checklist for email, payments, and your first invoice.
                    </Text>
                </Card>
            </div>

            <Flex justify="between" align="center" gap="3" mt="5" className="setup-actions">
                <Button
                    type="button"
                    size="3"
                    variant="ghost"
                    color="gray"
                    disabled={stepIndex === 0}
                    onClick={() => { setStepError(''); setStep(STEPS[stepIndex - 1].id); }}
                >
                    <ArrowLeft size={16} /> Back
                </Button>
                {step === 'review' ? (
                    <Button type="submit" size="3" loading={isPending}>
                        <Rocket size={16} /> Create workspace
                    </Button>
                ) : (
                    <Button type="button" size="3" onClick={goNext}>
                        Continue <ArrowRight size={16} />
                    </Button>
                )}
            </Flex>
        </form>
    );
}
