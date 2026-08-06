'use client';

import { useState } from 'react';
import { Box, Button, Card, Flex, Grid, Select, Switch, Text, TextArea, TextField } from '@radix-ui/themes';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import SettingsSectionForm, { Field } from './SettingsSectionForm';
import { SITE_ICON_NAMES } from '@/lib/site-icons';
import type {
    AppConfig,
    PublicSiteHighlight,
    PublicSiteService,
    PublicSiteTestimonial,
} from '@/lib/types';

interface EditorState {
    enabled: boolean;
    heroHeading: string;
    heroSubheading: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
    highlights: PublicSiteHighlight[];
    services: PublicSiteService[];
    testimonials: PublicSiteTestimonial[];
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

function IconSelect({
    value,
    onChange,
}: {
    value: string;
    onChange: (icon: string) => void;
}) {
    return (
        <Select.Root value={value || 'wrench'} onValueChange={onChange}>
            <Select.Trigger />
            <Select.Content>
                {SITE_ICON_NAMES.map((name) => (
                    <Select.Item key={name} value={name}>{name}</Select.Item>
                ))}
            </Select.Content>
        </Select.Root>
    );
}

function RowControls({
    index,
    count,
    onMove,
    onRemove,
    label,
}: {
    index: number;
    count: number;
    onMove: (direction: -1 | 1) => void;
    onRemove: () => void;
    label: string;
}) {
    return (
        <Flex gap="1" align="center">
            <Button type="button" variant="ghost" size="1" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${label} up`}>
                <ChevronUp size={16} />
            </Button>
            <Button type="button" variant="ghost" size="1" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Move ${label} down`}>
                <ChevronDown size={16} />
            </Button>
            <Button type="button" variant="ghost" size="1" color="red" onClick={onRemove} aria-label={`Remove ${label}`}>
                <Trash2 size={16} />
            </Button>
        </Flex>
    );
}

export default function PublicSiteSettingsForm({ config }: { config: Partial<AppConfig> }) {
    const publicSite = config.publicSite;
    const [state, setState] = useState<EditorState>(() => ({
        enabled: publicSite?.enabled ?? true,
        heroHeading: publicSite?.heroHeading || '',
        heroSubheading: publicSite?.heroSubheading || '',
        seoTitle: publicSite?.seoTitle || '',
        seoDescription: publicSite?.seoDescription || '',
        seoKeywords: publicSite?.seoKeywords || [],
        highlights: publicSite?.highlights || [],
        services: publicSite?.services || [],
        testimonials: publicSite?.testimonials || [],
    }));

    const patch = (update: Partial<EditorState>) => setState((prev) => ({ ...prev, ...update }));

    const patchService = (index: number, update: Partial<PublicSiteService>) => {
        setState((prev) => {
            const services = [...prev.services];
            services[index] = { ...services[index], ...update };
            return { ...prev, services };
        });
    };

    return (
        <SettingsSectionForm section="publicSite">
            <input type="hidden" name="publicSiteJson" value={JSON.stringify(state)} readOnly />

            <Card variant="surface">
                <Flex justify="between" align="center" gap="3">
                    <Box>
                        <Text as="div" size="2" weight="bold">Public marketing site</Text>
                        <Text as="div" size="1" color="gray">
                            When off, your homepage shows a simple card with your business name and a sign-in link.
                        </Text>
                    </Box>
                    <Switch
                        checked={state.enabled}
                        onCheckedChange={(enabled) => patch({ enabled })}
                        aria-label="Enable public marketing site"
                    />
                </Flex>
            </Card>

            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Field label="Hero heading" hint="Big headline at the top of the homepage. Defaults to your tagline.">
                    <TextField.Root
                        value={state.heroHeading}
                        onChange={(e) => patch({ heroHeading: e.target.value })}
                        placeholder="Expert repairs, done right"
                    />
                </Field>
                <Field label="Hero subheading">
                    <TextField.Root
                        value={state.heroSubheading}
                        onChange={(e) => patch({ heroSubheading: e.target.value })}
                        placeholder="One call covers it all."
                    />
                </Field>
            </Grid>

            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Field label="Search result title (SEO)">
                    <TextField.Root
                        value={state.seoTitle}
                        onChange={(e) => patch({ seoTitle: e.target.value })}
                        placeholder="Acme Contracting | Repairs & Renovations"
                    />
                </Field>
                <Field label="Search keywords" hint="Comma-separated.">
                    <TextField.Root
                        value={state.seoKeywords.join(', ')}
                        onChange={(e) => patch({ seoKeywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                        placeholder="contractor springfield, home repair"
                    />
                </Field>
            </Grid>
            <Field label="Search result description (SEO)">
                <TextArea
                    value={state.seoDescription}
                    onChange={(e) => patch({ seoDescription: e.target.value })}
                    rows={2}
                    placeholder="Home repairs, renovations, and more in Springfield."
                />
            </Field>

            {/* ── Why choose us ─────────────────────────────────────── */}
            <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 16 }}>
                <Flex justify="between" align="center" mb="2" gap="2" wrap="wrap">
                    <Box>
                        <Text size="3" weight="bold" as="div">Why choose us</Text>
                        <Text size="1" color="gray" as="div">Up to six selling points shown under the hero. Leave empty to hide the section.</Text>
                    </Box>
                    <Button
                        type="button"
                        variant="soft"
                        size="2"
                        disabled={state.highlights.length >= 6}
                        onClick={() => patch({ highlights: [...state.highlights, { title: '', text: '', icon: 'star' }] })}
                    >
                        <Plus size={14} /> Add point
                    </Button>
                </Flex>
                <Flex direction="column" gap="3">
                    {state.highlights.map((highlight, index) => (
                        <Card key={index} variant="surface">
                            <Flex direction="column" gap="3">
                                <Flex justify="between" align="center" gap="2">
                                    <Text size="2" weight="bold">Point {index + 1}</Text>
                                    <RowControls
                                        index={index}
                                        count={state.highlights.length}
                                        label="selling point"
                                        onMove={(dir) => patch({ highlights: moveItem(state.highlights, index, dir) })}
                                        onRemove={() => patch({ highlights: state.highlights.filter((_, i) => i !== index) })}
                                    />
                                </Flex>
                                <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                                    <Field label="Title">
                                        <TextField.Root
                                            value={highlight.title}
                                            onChange={(e) => {
                                                const highlights = [...state.highlights];
                                                highlights[index] = { ...highlight, title: e.target.value };
                                                patch({ highlights });
                                            }}
                                            placeholder="Local & Personal"
                                        />
                                    </Field>
                                    <Field label="Icon">
                                        <IconSelect
                                            value={highlight.icon || 'star'}
                                            onChange={(icon) => {
                                                const highlights = [...state.highlights];
                                                highlights[index] = { ...highlight, icon };
                                                patch({ highlights });
                                            }}
                                        />
                                    </Field>
                                </Grid>
                                <Field label="Text">
                                    <TextArea
                                        value={highlight.text}
                                        onChange={(e) => {
                                            const highlights = [...state.highlights];
                                            highlights[index] = { ...highlight, text: e.target.value };
                                            patch({ highlights });
                                        }}
                                        rows={2}
                                        placeholder="You deal directly with the person doing the work."
                                    />
                                </Field>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            </Box>

            {/* ── Services ──────────────────────────────────────────── */}
            <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 16 }}>
                <Flex justify="between" align="center" mb="2" gap="2" wrap="wrap">
                    <Box>
                        <Text size="3" weight="bold" as="div">Services</Text>
                        <Text size="1" color="gray" as="div">
                            Each service gets a card on the homepage, its own detail page, and an option in the quote form.
                        </Text>
                    </Box>
                    <Button
                        type="button"
                        variant="soft"
                        size="2"
                        disabled={state.services.length >= 12}
                        onClick={() => patch({
                            services: [...state.services, {
                                slug: '',
                                formValue: '',
                                title: '',
                                shortTitle: '',
                                description: '',
                                summary: '',
                                highlights: [],
                                idealFor: [],
                                icon: 'wrench',
                            }],
                        })}
                    >
                        <Plus size={14} /> Add service
                    </Button>
                </Flex>
                <Flex direction="column" gap="3">
                    {state.services.map((service, index) => (
                        <Card key={index} variant="surface">
                            <Flex direction="column" gap="3">
                                <Flex justify="between" align="center" gap="2">
                                    <Text size="2" weight="bold">{service.shortTitle || `Service ${index + 1}`}</Text>
                                    <RowControls
                                        index={index}
                                        count={state.services.length}
                                        label="service"
                                        onMove={(dir) => patch({ services: moveItem(state.services, index, dir) })}
                                        onRemove={() => patch({ services: state.services.filter((_, i) => i !== index) })}
                                    />
                                </Flex>
                                <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                                    <Field label="Name" hint="Short name shown on cards and in the quote form.">
                                        <TextField.Root
                                            value={service.shortTitle}
                                            onChange={(e) => {
                                                const shortTitle = e.target.value;
                                                const auto = slugify(shortTitle);
                                                patchService(index, {
                                                    shortTitle,
                                                    // Keep slug/formValue following the name until customized.
                                                    slug: service.slug === slugify(service.shortTitle) ? auto : service.slug,
                                                    formValue: service.formValue === slugify(service.shortTitle) ? auto : service.formValue,
                                                });
                                            }}
                                            placeholder="General Contracting"
                                        />
                                    </Field>
                                    <Field label="Icon">
                                        <IconSelect
                                            value={service.icon || 'wrench'}
                                            onChange={(icon) => patchService(index, { icon })}
                                        />
                                    </Field>
                                </Grid>
                                <Field label="Page headline" hint="Longer title on the service detail page. Defaults to the name.">
                                    <TextField.Root
                                        value={service.title}
                                        onChange={(e) => patchService(index, { title: e.target.value })}
                                        placeholder="General Contracting in Springfield"
                                    />
                                </Field>
                                <Field label="Description" hint="One or two sentences shown on the homepage card and detail page.">
                                    <TextArea
                                        value={service.description}
                                        onChange={(e) => patchService(index, { description: e.target.value })}
                                        rows={2}
                                    />
                                </Field>
                                <Field label='"How we can help" summary'>
                                    <TextArea
                                        value={service.summary}
                                        onChange={(e) => patchService(index, { summary: e.target.value })}
                                        rows={2}
                                    />
                                </Field>
                                <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                                    <Field label="What's included" hint="One item per line.">
                                        <TextArea
                                            value={service.highlights.join('\n')}
                                            onChange={(e) => patchService(index, { highlights: e.target.value.split('\n') })}
                                            rows={4}
                                            placeholder={'Drywall repair and painting\nFlooring installation'}
                                        />
                                    </Field>
                                    <Field label="A practical fit for" hint="One item per line.">
                                        <TextArea
                                            value={service.idealFor.join('\n')}
                                            onChange={(e) => patchService(index, { idealFor: e.target.value.split('\n') })}
                                            rows={4}
                                            placeholder={'Homeowners with a repair list\nProperty owners preparing a rental'}
                                        />
                                    </Field>
                                </Grid>
                                <Field label="URL slug" hint={`Page address: /services/${service.slug || 'example'}`}>
                                    <TextField.Root
                                        value={service.slug}
                                        onChange={(e) => patchService(index, { slug: slugify(e.target.value), formValue: slugify(e.target.value) })}
                                        style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
                                    />
                                </Field>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            </Box>

            {/* ── Testimonials ──────────────────────────────────────── */}
            <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 16 }}>
                <Flex justify="between" align="center" mb="2" gap="2" wrap="wrap">
                    <Box>
                        <Text size="3" weight="bold" as="div">Testimonials</Text>
                        <Text size="1" color="gray" as="div">Client quotes shown on the homepage. Leave empty to hide the section.</Text>
                    </Box>
                    <Button
                        type="button"
                        variant="soft"
                        size="2"
                        disabled={state.testimonials.length >= 12}
                        onClick={() => patch({ testimonials: [...state.testimonials, { name: '', service: '', quote: '' }] })}
                    >
                        <Plus size={14} /> Add testimonial
                    </Button>
                </Flex>
                <Flex direction="column" gap="3">
                    {state.testimonials.map((testimonial, index) => (
                        <Card key={index} variant="surface">
                            <Flex direction="column" gap="3">
                                <Flex justify="between" align="center" gap="2">
                                    <Text size="2" weight="bold">{testimonial.name || `Testimonial ${index + 1}`}</Text>
                                    <RowControls
                                        index={index}
                                        count={state.testimonials.length}
                                        label="testimonial"
                                        onMove={(dir) => patch({ testimonials: moveItem(state.testimonials, index, dir) })}
                                        onRemove={() => patch({ testimonials: state.testimonials.filter((_, i) => i !== index) })}
                                    />
                                </Flex>
                                <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                                    <Field label="Client name">
                                        <TextField.Root
                                            value={testimonial.name}
                                            onChange={(e) => {
                                                const testimonials = [...state.testimonials];
                                                testimonials[index] = { ...testimonial, name: e.target.value };
                                                patch({ testimonials });
                                            }}
                                        />
                                    </Field>
                                    <Field label="Service (badge)">
                                        <TextField.Root
                                            value={testimonial.service}
                                            onChange={(e) => {
                                                const testimonials = [...state.testimonials];
                                                testimonials[index] = { ...testimonial, service: e.target.value };
                                                patch({ testimonials });
                                            }}
                                            placeholder="Kitchen remodel"
                                        />
                                    </Field>
                                </Grid>
                                <Field label="Quote">
                                    <TextArea
                                        value={testimonial.quote}
                                        onChange={(e) => {
                                            const testimonials = [...state.testimonials];
                                            testimonials[index] = { ...testimonial, quote: e.target.value };
                                            patch({ testimonials });
                                        }}
                                        rows={3}
                                    />
                                </Field>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            </Box>
        </SettingsSectionForm>
    );
}
