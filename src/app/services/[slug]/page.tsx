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
import {
    BUSINESS_NAME,
    getMarketingService,
    getSiteUrl,
    marketingServices,
    PHONE_DISPLAY,
    PHONE_HREF,
    SERVICE_AREA,
} from '@/lib/marketing';

interface ServicePageProps {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return marketingServices.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
    const { slug } = await params;
    const service = getMarketingService(slug);

    if (!service) {
        return {};
    }

    const title = `${service.shortTitle} | Marotto Solutions`;
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
    const service = getMarketingService(slug);

    if (!service) {
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
        areaServed: {
            '@type': 'AdministrativeArea',
            name: 'Northeast Pennsylvania',
        },
        provider: {
            '@type': 'LocalBusiness',
            name: BUSINESS_NAME,
            url: siteUrl,
            telephone: PHONE_DISPLAY,
        },
    };

    return (
        <Box>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd).replace(/</g, '\\u003c') }}
            />

            <Flex px="5" py="4" justify="between" align="center" style={{ borderBottom: '1px solid var(--gray-5)' }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Heading size="5">{BUSINESS_NAME}</Heading>
                </Link>
                <Flex gap="3" align="center">
                    <Button variant="ghost" size="2" asChild>
                        <a href={PHONE_HREF} aria-label={`Call ${BUSINESS_NAME} at ${PHONE_DISPLAY}`}>
                            <Phone size={14} /> Call
                        </a>
                    </Button>
                    <Box display={{ initial: 'none', sm: 'block' }}>
                        <Button size="2" asChild>
                            <Link href={quoteHref}>Get a Quote</Link>
                        </Button>
                    </Box>
                </Flex>
            </Flex>

            <Container size="3">
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
                            <Flex gap="2" align="center">
                                <MapPin size={16} style={{ color: 'var(--gray-8)' }} />
                                <Text size="3" color="gray">Serving {SERVICE_AREA}</Text>
                            </Flex>
                            <Flex gap="3" mt="3" wrap="wrap">
                                <Button size="4" asChild>
                                    <Link href={quoteHref}>Request a Quote <ArrowRight /></Link>
                                </Button>
                                <Button size="4" variant="outline" asChild>
                                    <a href={PHONE_HREF}><Phone size={16} /> Call {PHONE_DISPLAY}</a>
                                </Button>
                            </Flex>
                        </Flex>
                    </Flex>
                </Section>

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
                                <Button size="3" variant="outline" asChild>
                                    <a href={PHONE_HREF}>Call {PHONE_DISPLAY}</a>
                                </Button>
                            </Flex>
                        </Grid>
                    </Card>
                </Section>
            </Container>

            <Box mt="8" py="6" style={{ backgroundColor: 'var(--gray-2)' }}>
                <Container size="3">
                    <Flex direction={{ initial: 'column', sm: 'row' }} justify="between" align="center" gap="3">
                        <Text size="2" color="gray">
                            &copy; {new Date().getFullYear()} {BUSINESS_NAME}
                        </Text>
                        <Flex gap="4" wrap="wrap" justify="center">
                            <Link href="/#services">Services</Link>
                            <Link href={quoteHref}>Get a Quote</Link>
                            <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
                        </Flex>
                    </Flex>
                </Container>
            </Box>
        </Box>
    );
}
