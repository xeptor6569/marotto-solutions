import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    MapPin,
    Phone,
} from 'lucide-react';
import {
    Box,
    Button,
    Card,
    Container,
    Flex,
    Grid,
    Heading,
    Section,
    Text,
} from '@radix-ui/themes';
import PublicHeader from '@/app/components/PublicHeader';
import PublicFooter from '@/app/components/PublicFooter';
import { getBranding, getPublicSiteService, getSiteUrl } from '@/lib/branding';

interface ServicePageProps {
    params: Promise<{ slug: string }>;
}

// Services are user-configured at runtime, so pages render on demand.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
    const { slug } = await params;
    const { business, publicSite } = await getBranding();
    const service = getPublicSiteService(publicSite, slug);

    if (!publicSite.enabled || !service) {
        return {};
    }

    const title = `${service.shortTitle} | ${business.name}`;
    const canonical = `/services/${service.slug}`;

    return {
        title: { absolute: title },
        description: service.description,
        alternates: { canonical },
        openGraph: {
            title,
            description: service.description,
            url: canonical,
            type: 'website',
        },
    };
}

export default async function ServicePage({ params }: ServicePageProps) {
    const { slug } = await params;
    const { business, branding, publicSite } = await getBranding();
    const service = getPublicSiteService(publicSite, slug);

    if (!publicSite.enabled || !service) {
        notFound();
    }

    const siteUrl = getSiteUrl();
    const quoteHref = `/?service=${encodeURIComponent(service.formValue)}#quote`;
    const serviceJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.shortTitle,
        description: service.description,
        url: `${siteUrl}/services/${service.slug}`,
        ...(business.serviceArea
            ? { areaServed: { '@type': 'AdministrativeArea', name: business.serviceArea } }
            : {}),
        provider: {
            '@type': 'LocalBusiness',
            name: business.name,
            url: siteUrl,
            ...(business.phoneDisplay ? { telephone: business.phoneDisplay } : {}),
        },
    };

    return (
        <Box>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd).replace(/</g, '\\u003c') }}
            />

            <PublicHeader business={business} branding={branding} quoteHref={quoteHref} />

            <Container size="3" px="4">
                <Section size="3">
                    <Flex direction="column" gap="5">
                        <Link href="/#services" style={{ alignSelf: 'flex-start' }}>
                            <Flex gap="2" align="center">
                                <ArrowLeft size={15} />
                                <Text size="2">All services</Text>
                            </Flex>
                        </Link>

                        <Flex direction="column" gap="4" style={{ maxWidth: 820 }}>
                            <Heading as="h1" size={{ initial: '8', sm: '9' }}>
                                {service.title}
                            </Heading>
                            <Text size="5" color="gray" style={{ lineHeight: 1.6 }}>
                                {service.description}
                            </Text>
                            {business.serviceArea ? (
                                <Flex gap="2" align="center">
                                    <MapPin size={16} style={{ color: 'var(--gray-8)' }} />
                                    <Text size="3" color="gray">Serving {business.serviceArea}</Text>
                                </Flex>
                            ) : null}
                            <Flex gap="3" mt="3" wrap="wrap">
                                <Button size="4" asChild>
                                    <Link href={quoteHref}>Request a Quote <ArrowRight /></Link>
                                </Button>
                                {business.phoneHref ? (
                                    <Button size="4" variant="outline" asChild>
                                        <a href={business.phoneHref}><Phone size={16} /> Call {business.phoneDisplay}</a>
                                    </Button>
                                ) : null}
                            </Flex>
                        </Flex>
                    </Flex>
                </Section>

                {service.summary || service.highlights.length ? (
                    <Box py="8" px="5" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-5)' }}>
                        <Grid columns={{ initial: '1', md: '2' }} gap="8">
                            <Flex direction="column" gap="3">
                                <Heading as="h2" size="6">How we can help</Heading>
                                <Text size="3" color="gray" style={{ lineHeight: 1.7 }}>
                                    {service.summary}
                                </Text>
                            </Flex>
                            <Flex direction="column" gap="3">
                                {service.highlights.map((highlight) => (
                                    <Flex key={highlight} gap="3" align="start">
                                        <CheckCircle2 size={19} style={{ color: 'var(--accent-9)', flexShrink: 0, marginTop: 2 }} />
                                        <Text size="3">{highlight}</Text>
                                    </Flex>
                                ))}
                            </Flex>
                        </Grid>
                    </Box>
                ) : null}

                {service.idealFor.length ? (
                    <Section size="3">
                        <Heading as="h2" size="7" mb="5">A practical fit for</Heading>
                        <Grid columns={{ initial: '1', sm: '3' }} gap="4">
                            {service.idealFor.map((customer) => (
                                <Card key={customer} size="3">
                                    <Text size="3" style={{ lineHeight: 1.6 }}>{customer}</Text>
                                </Card>
                            ))}
                        </Grid>
                    </Section>
                ) : null}

                <Section size="2">
                    <Card size="4">
                        <Grid columns={{ initial: '1', md: '2' }} gap="6" align="center">
                            <Box>
                                <Heading as="h2" size="6" mb="2">Tell us what you need</Heading>
                                <Text color="gray" style={{ lineHeight: 1.6 }}>
                                    Share a few project details and your preferred schedule. We will review the request and follow up with next steps.
                                </Text>
                            </Box>
                            <Flex gap="3" justify={{ initial: 'start', md: 'end' }} wrap="wrap">
                                <Button size="3" asChild>
                                    <Link href={quoteHref}>Request a Quote</Link>
                                </Button>
                                {business.phoneHref ? (
                                    <Button size="3" variant="outline" asChild>
                                        <a href={business.phoneHref}>Call {business.phoneDisplay}</a>
                                    </Button>
                                ) : null}
                            </Flex>
                        </Grid>
                    </Card>
                </Section>
            </Container>

            <Box mt="8">
                <PublicFooter business={business} />
            </Box>
        </Box>
    );
}
