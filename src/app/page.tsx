import { Container, Heading, Text, Flex, Button, Card, Grid, Box, Section, Badge } from "@radix-ui/themes";
import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Quote, LogIn } from "lucide-react";
import type { Metadata } from "next";
import QuoteForm from "./components/QuoteForm";
import PublicHeader from "./components/PublicHeader";
import PublicFooter from "./components/PublicFooter";
import { getBranding, getSiteUrl } from "@/lib/branding";
import { getSiteIcon } from "@/lib/site-icons";

export async function generateMetadata(): Promise<Metadata> {
    const { publicSite, business } = await getBranding();
    if (!publicSite.enabled) {
        return {
            title: { absolute: business.name },
            robots: { index: false },
        };
    }
    return {
        title: { absolute: publicSite.seoTitle },
        description: publicSite.seoDescription || undefined,
        keywords: publicSite.seoKeywords.length ? publicSite.seoKeywords : undefined,
        alternates: { canonical: '/' },
    };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string; service?: string }> }) {
    const { submitted, error, service } = await searchParams;
    const { business, branding, publicSite } = await getBranding();

    if (!publicSite.enabled) {
        return (
            <Flex align="center" justify="center" style={{ minHeight: '100dvh' }} p="5">
                <Card size="4" style={{ width: '100%', maxWidth: 420 }}>
                    <Flex direction="column" align="center" gap="4" py="4">
                        {branding.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={branding.logoUrl} alt="" style={{ height: 56, width: 'auto', borderRadius: 8 }} />
                        ) : null}
                        <Flex direction="column" align="center" gap="1">
                            <Heading size="6" align="center">{business.name}</Heading>
                            {business.tagline ? (
                                <Text size="2" color="gray" align="center">{business.tagline}</Text>
                            ) : null}
                        </Flex>
                        {business.phoneHref ? (
                            <Button variant="soft" size="3" asChild>
                                <a href={business.phoneHref}><Phone size={16} /> {business.phoneDisplay || 'Call us'}</a>
                            </Button>
                        ) : null}
                        <Button size="3" asChild>
                            <Link href="/auth/signin"><LogIn size={16} /> Sign in</Link>
                        </Button>
                    </Flex>
                </Card>
            </Flex>
        );
    }

    const siteUrl = getSiteUrl();
    const localBusinessJsonLd = {
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'ProfessionalService'],
        name: business.name,
        url: siteUrl,
        ...(business.phoneDisplay ? { telephone: business.phoneDisplay } : {}),
        ...(publicSite.seoDescription ? { description: publicSite.seoDescription } : {}),
        ...(business.serviceArea
            ? { areaServed: { '@type': 'AdministrativeArea', name: business.serviceArea } }
            : {}),
        ...(publicSite.services.length
            ? {
                hasOfferCatalog: {
                    '@type': 'OfferCatalog',
                    name: 'Services',
                    itemListElement: publicSite.services.map((item) => ({
                        '@type': 'Offer',
                        itemOffered: {
                            '@type': 'Service',
                            name: item.shortTitle,
                            description: item.description,
                            url: `${siteUrl}/services/${item.slug}`,
                        },
                    })),
                },
            }
            : {}),
    };

    const quoteServices = publicSite.services.map((s) => ({ value: s.formValue, label: s.shortTitle }));

    return (
        <Box>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd).replace(/</g, '\\u003c') }}
            />
            <PublicHeader business={business} branding={branding} />

            <Container size="3" px="4">
                {/* Hero Section */}
                <Section size="3">
                    <Flex direction="column" align="center" gap="5" style={{ textAlign: 'center' }}>
                        <Heading size={{ initial: '8', sm: '9' }} style={{ maxWidth: 800 }}>
                            {publicSite.heroHeading}
                        </Heading>
                        {publicSite.heroSubheading ? (
                            <Text size="5" color="gray" style={{ maxWidth: 600 }}>
                                {publicSite.heroSubheading}
                            </Text>
                        ) : null}
                        {business.serviceArea ? (
                            <Flex gap="2" align="center">
                                <MapPin size={16} style={{ color: 'var(--gray-8)' }} />
                                <Text size="3" color="gray">Serving {business.serviceArea}</Text>
                            </Flex>
                        ) : null}
                        <Flex gap="3" mt="4" wrap="wrap" justify="center">
                            <Button size="4" asChild>
                                <Link href="#quote">Get a Quote <ArrowRight /></Link>
                            </Button>
                            {publicSite.services.length ? (
                                <Button size="4" variant="soft" asChild>
                                    <Link href="#services">View Services</Link>
                                </Button>
                            ) : null}
                            {business.phoneHref ? (
                                <Button size="4" variant="outline" asChild>
                                    <a href={business.phoneHref}><Phone size={16} /> Call {business.phoneDisplay}</a>
                                </Button>
                            ) : null}
                        </Flex>
                    </Flex>
                </Section>

                {/* Why Choose Us */}
                {publicSite.highlights.length ? (
                    <Box style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-5)' }} py="8" px="5">
                        <Container size="3">
                            <Heading size="7" mb="6" align="center">Why Choose {business.name}</Heading>
                            <Grid columns={{ initial: '1', sm: String(Math.min(publicSite.highlights.length, 3)) as '1' | '2' | '3' }} gap="5">
                                {publicSite.highlights.map((highlight, index) => {
                                    const Icon = getSiteIcon(highlight.icon);
                                    return (
                                        <Card key={index} size="3" className="hover-card">
                                            <Flex direction="column" align="center" gap="3" py="4">
                                                <Box p="3" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                                    <Icon size={28} color="var(--accent-9)" />
                                                </Box>
                                                <Heading size="4" align="center">{highlight.title}</Heading>
                                                <Text color="gray" align="center" size="2">
                                                    {highlight.text}
                                                </Text>
                                            </Flex>
                                        </Card>
                                    );
                                })}
                            </Grid>
                        </Container>
                    </Box>
                ) : null}

                {/* Services Section */}
                {publicSite.services.length ? (
                    <Section size="3" id="services">
                        <Heading size="7" mb="5" align="center">Our Services</Heading>
                        <Grid columns={{ initial: '1', sm: '2' }} gap="5">
                            {publicSite.services.map((service) => {
                                const Icon = getSiteIcon(service.icon);
                                return (
                                    <Card key={service.slug} size="3" className="hover-card">
                                        <Flex gap="3" align="center" mb="2">
                                            <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                                <Icon size={24} color="var(--accent-9)" />
                                            </Box>
                                            <Heading size="4">{service.shortTitle}</Heading>
                                        </Flex>
                                        <Flex direction="column" gap="1">
                                            <Text color="gray">{service.description}</Text>
                                            {service.highlights.length ? (
                                                <Text size="2" color="gray">
                                                    {service.highlights.slice(0, 4).join(' • ')}
                                                </Text>
                                            ) : null}
                                            <Link href={`/services/${service.slug}`} style={{ marginTop: 8 }}>
                                                Learn about {service.shortTitle.toLowerCase()}
                                            </Link>
                                        </Flex>
                                    </Card>
                                );
                            })}
                        </Grid>
                    </Section>
                ) : null}

                {/* Testimonials */}
                {publicSite.testimonials.length ? (
                    <Box style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-5)' }} py="8" px="5">
                        <Container size="3">
                            <Heading size="7" mb="6" align="center">What Clients Say</Heading>
                            <Grid columns={{ initial: '1', sm: '2' }} gap="5">
                                {publicSite.testimonials.map((t, i) => (
                                    <Card size="3" key={i} className="hover-card">
                                        <Flex direction="column" gap="3">
                                            <Quote size={20} style={{ color: 'var(--gray-6)', transform: 'scaleX(-1)' }} />
                                            <Text size="3" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>{t.quote}</Text>
                                            <Flex justify="between" align="center" mt="2" gap="2" wrap="wrap">
                                                <Text weight="bold">{t.name}</Text>
                                                {t.service ? <Badge color="gray" variant="soft">{t.service}</Badge> : null}
                                            </Flex>
                                        </Flex>
                                    </Card>
                                ))}
                            </Grid>
                        </Container>
                    </Box>
                ) : null}

                {/* Quote Section */}
                <Section size="3" id="quote">
                    <Grid columns={{ initial: '1', md: '2' }} gap="8" align="center">
                        <Box>
                            <Heading size="7" mb="4">Ready to start?</Heading>
                            <Text size="4" color="gray" mb="4" as="p">
                                Tell us about your project and we&apos;ll get back to you with an estimate and availability.
                            </Text>
                            <Flex direction="column" gap="3" mt="5">
                                {business.phoneHref ? (
                                    <Button size="3" variant="outline" asChild>
                                        <a href={business.phoneHref}><Phone size={16} /> Call Us: {business.phoneDisplay}</a>
                                    </Button>
                                ) : null}
                                {business.serviceArea ? (
                                    <Flex gap="2" align="center">
                                        <MapPin size={14} style={{ color: 'var(--gray-8)' }} />
                                        <Text size="2" color="gray">Serving {business.serviceArea}</Text>
                                    </Flex>
                                ) : null}
                            </Flex>
                        </Box>
                        <Box>
                            {submitted ? (
                                <Card size="3" style={{ backgroundColor: 'var(--green-3)' }}>
                                    <Flex direction="column" align="center" py="5" gap="3">
                                        <Heading size="5" color="green">Request Received!</Heading>
                                        <Text align="center">Thank you for your request. We will be in touch shortly.</Text>
                                        <Button variant="outline" asChild>
                                            <Link href="/">Submit Another</Link>
                                        </Button>
                                    </Flex>
                                </Card>
                            ) : error ? (
                                <Card size="3" style={{ backgroundColor: 'var(--red-3)' }}>
                                    <Flex direction="column" align="center" py="5" gap="3">
                                        <Heading size="5" color="red">Something went wrong</Heading>
                                        <Text align="center">
                                            {error === 'missing'
                                                ? 'Please fill in your name, email, phone number, and project details.'
                                                : 'We could not save your request. Please try again or email us directly.'}
                                        </Text>
                                        <Button variant="outline" asChild>
                                            <Link href="/#quote">Try again</Link>
                                        </Button>
                                    </Flex>
                                </Card>
                            ) : (
                                <QuoteForm defaultService={service} services={quoteServices} />
                            )}
                        </Box>
                    </Grid>
                </Section>
            </Container>

            <PublicFooter business={business} />
        </Box>
    );
}
