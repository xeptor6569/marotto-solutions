import { Container, Heading, Text, Flex, Button, Card, Grid, Box, Section, Badge } from "@radix-ui/themes";
import Link from 'next/link';
import { ArrowRight, Hammer, Monitor, Cpu, Code, Phone, MapPin, Wrench, Users, Zap } from "lucide-react";
import QuoteForm from "./components/QuoteForm";
import { testimonials } from "@/lib/testimonials";
import { Quote } from "lucide-react";
import type { Metadata } from "next";
import {
    BUSINESS_NAME,
    getSiteUrl,
    marketingServices,
    PHONE_DISPLAY,
    PHONE_HREF,
    SERVICE_AREA,
} from "@/lib/marketing";

export const metadata: Metadata = {
    title: {
        absolute: "Marotto Solutions | Contracting & IT Services",
    },
    description: "General contracting and IT services in Pittston, PA — home renovations, networking, custom PC builds, and automation.",
    alternates: {
        canonical: '/',
    },
};

const serviceHrefByFormValue = new Map(
    marketingServices.map((service) => [service.formValue, `/services/${service.slug}`]),
);

export default async function Home({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string; service?: string }> }) {
    const { submitted, error, service } = await searchParams;
    const siteUrl = getSiteUrl();
    const localBusinessJsonLd = {
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'ProfessionalService'],
        name: BUSINESS_NAME,
        url: siteUrl,
        telephone: PHONE_DISPLAY,
        description: metadata.description,
        areaServed: [
            { '@type': 'City', name: 'Pittston, Pennsylvania' },
            { '@type': 'City', name: 'Wilkes-Barre, Pennsylvania' },
            { '@type': 'AdministrativeArea', name: 'Northeast Pennsylvania' },
        ],
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Services',
            itemListElement: marketingServices.map((item) => ({
                '@type': 'Offer',
                itemOffered: {
                    '@type': 'Service',
                    name: item.shortTitle,
                    description: item.description,
                    url: `${siteUrl}/services/${item.slug}`,
                },
            })),
        },
    };

    return (
        <Box>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd).replace(/</g, '\\u003c') }}
            />
            {/* Navigation / Header */}
            <Flex px="5" py="4" justify="between" align="center" style={{ borderBottom: '1px solid var(--gray-5)' }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Heading size="5">Marotto Solutions</Heading>
                </Link>
                <Flex gap="3" align="center">
                    <Button variant="ghost" size="2" asChild>
                        <a href={PHONE_HREF} aria-label={`Call ${BUSINESS_NAME} at ${PHONE_DISPLAY}`}>
                            <Phone size={14} /> Call
                        </a>
                    </Button>
                    <Box display={{ initial: 'none', sm: 'block' }}>
                        <Button size="2" asChild>
                            <Link href="#quote">Get a Quote</Link>
                        </Button>
                    </Box>
                </Flex>
            </Flex>

            <Container size="3">
                {/* Hero Section */}
                <Section size="3" style={{ backgroundColor: 'var(--color-page-background)' }}>
                    <Flex direction="column" align="center" gap="5" style={{ textAlign: 'center' }}>
                        <Heading size={{ initial: '8', sm: '9' }} style={{ maxWidth: 800 }}>
                            Expert General Contracting & IT Services
                        </Heading>
                        <Text size="5" color="gray" style={{ maxWidth: 600 }}>
                            Home renovations, custom PC builds, networking, and automation — one call covers it all.
                        </Text>
                        <Flex gap="2" align="center">
                            <MapPin size={16} style={{ color: 'var(--gray-8)' }} />
                            <Text size="3" color="gray">Serving {SERVICE_AREA}</Text>
                        </Flex>
                        <Flex gap="3" mt="4" wrap="wrap" justify="center">
                            <Button size="4" asChild>
                                <Link href="#quote">Get a Quote <ArrowRight /></Link>
                            </Button>
                            <Button size="4" variant="soft" asChild>
                                <Link href="#services">View Services</Link>
                            </Button>
                            <Button size="4" variant="outline" asChild>
                                <a href={PHONE_HREF}><Phone size={16} /> Call {PHONE_DISPLAY}</a>
                            </Button>
                        </Flex>
                    </Flex>
                </Section>

                {/* Why Choose Us */}
                <Box style={{ backgroundColor: 'var(--gray-2)' }} py="8" px="5">
                    <Container size="3">
                        <Heading size="7" mb="6" align="center">Why Choose Marotto Solutions</Heading>
                        <Grid columns={{ initial: '1', sm: '3' }} gap="5">
                            <Card size="3" style={{ transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
                                className="hover-card">
                                <Flex direction="column" align="center" gap="3" py="4">
                                    <Box p="3" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                        <Wrench size={28} color="var(--accent-9)" />
                                    </Box>
                                    <Heading size="4" align="center">Physical & Digital, One Partner</Heading>
                                    <Text color="gray" align="center" size="2">
                                        No more juggling separate contractors for your renovation and your network. One call covers both.
                                    </Text>
                                </Flex>
                            </Card>

                            <Card size="3" style={{ transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
                                className="hover-card">
                                <Flex direction="column" align="center" gap="3" py="4">
                                    <Box p="3" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                        <Users size={28} color="var(--accent-9)" />
                                    </Box>
                                    <Heading size="4" align="center">Local & Personal</Heading>
                                    <Text color="gray" align="center" size="2">
                                        Based in Pittston, PA. You deal directly with the person doing the work — no runaround, no call centers.
                                    </Text>
                                </Flex>
                            </Card>

                            <Card size="3" style={{ transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
                                className="hover-card">
                                <Flex direction="column" align="center" gap="3" py="4">
                                    <Box p="3" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                        <Zap size={28} color="var(--accent-9)" />
                                    </Box>
                                    <Heading size="4" align="center">Fast Turnaround</Heading>
                                    <Text color="gray" align="center" size="2">
                                        Small operation means quick response times. We get in, get it done right, and get you back to business.
                                    </Text>
                                </Flex>
                            </Card>
                        </Grid>
                    </Container>
                </Box>

                {/* Services Section */}
                <Section size="3" id="services">
                    <Heading size="7" mb="5" align="center">Our Services</Heading>
                    <Grid columns={{ initial: '1', sm: '2' }} gap="5">
                        <Card size="3" style={{ transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
                            className="hover-card">
                            <Flex gap="3" align="center" mb="2">
                                <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                    <Hammer size={24} color="var(--accent-9)" />
                                </Box>
                                <Heading size="4">General Contracting</Heading>
                            </Flex>
                            <Flex direction="column" gap="1">
                                <Text color="gray">Home repairs, renovations, and custom installations.</Text>
                                <Text size="2" color="gray">
                                    Drywall &amp; painting &bull; Flooring &bull; Kitchen &amp; bath updates &bull; Deck &amp; fence work
                                </Text>
                                <Link href={serviceHrefByFormValue.get('general')!} style={{ marginTop: 8 }}>
                                    Learn about general contracting
                                </Link>
                            </Flex>
                        </Card>

                        <Card size="3" style={{ transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
                            className="hover-card">
                            <Flex gap="3" align="center" mb="2">
                                <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                    <Monitor size={24} color="var(--accent-9)" />
                                </Box>
                                <Heading size="4">IT & Networking</Heading>
                            </Flex>
                            <Flex direction="column" gap="1">
                                <Text color="gray">Home and small business networking, security, and infrastructure.</Text>
                                <Text size="2" color="gray">
                                    Ethernet &amp; cable runs &bull; Patch panels &bull; WiFi mesh setup &bull; Firewall configuration &bull; Troubleshooting
                                </Text>
                                <Link href={serviceHrefByFormValue.get('it')!} style={{ marginTop: 8 }}>
                                    Learn about IT &amp; networking
                                </Link>
                            </Flex>
                        </Card>

                        <Card size="3" style={{ transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
                            className="hover-card">
                            <Flex gap="3" align="center" mb="2">
                                <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                    <Cpu size={24} color="var(--accent-9)" />
                                </Box>
                                <Heading size="4">Custom PC Building</Heading>
                            </Flex>
                            <Flex direction="column" gap="1">
                                <Text color="gray">High-performance systems tailored to your needs and budget.</Text>
                                <Text size="2" color="gray">
                                    Gaming rigs &bull; Workstations &bull; Home servers &bull; Quiet/compact builds
                                </Text>
                                <Link href={serviceHrefByFormValue.get('pc')!} style={{ marginTop: 8 }}>
                                    Learn about custom PC builds
                                </Link>
                            </Flex>
                        </Card>

                        <Card size="3" style={{ transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
                            className="hover-card">
                            <Flex gap="3" align="center" mb="2">
                                <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                    <Code size={24} color="var(--accent-9)" />
                                </Box>
                                <Heading size="4">Programming & Automation</Heading>
                            </Flex>
                            <Flex direction="column" gap="1">
                                <Text color="gray">Custom scripts, web apps, and automation to streamline your workflows.</Text>
                                <Text size="2" color="gray">
                                    Small business tools &bull; Workflow automation &bull; Data processing scripts &bull; Web applications
                                </Text>
                                <Link href={serviceHrefByFormValue.get('programming')!} style={{ marginTop: 8 }}>
                                    Learn about programming &amp; automation
                                </Link>
                            </Flex>
                        </Card>
                    </Grid>
                </Section>

                {/* Testimonials */}
                {testimonials.length > 0 ? (
                    <Box style={{ backgroundColor: 'var(--gray-2)' }} py="8" px="5">
                        <Container size="3">
                            <Heading size="7" mb="6" align="center">What Clients Say</Heading>
                            <Grid columns={{ initial: '1', sm: '2' }} gap="5">
                                {testimonials.map((t, i) => (
                                    <Card size="3" key={i} style={{ transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' }}
                                        className="hover-card">
                                        <Flex direction="column" gap="3">
                                            <Quote size={20} style={{ color: 'var(--gray-6)', transform: 'scaleX(-1)' }} />
                                            <Text size="3" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>{t.quote}</Text>
                                            <Flex justify="between" align="center" mt="2">
                                                <Text weight="bold">{t.name}</Text>
                                                <Badge color="gray" variant="soft">{t.service}</Badge>
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
                            <Text size="4" color="gray" mb="4">
                                Tell us about your project. Whether it's fixing a leak or setting up a server rack, we're here to help.
                            </Text>
                            <Text size="4" color="gray">
                                Fill out the form and we'll get back to you with an estimate and availability.
                            </Text>
                            <Flex direction="column" gap="3" mt="5">
                                <Button size="3" variant="outline" asChild>
                                    <a href={PHONE_HREF}><Phone size={16} /> Call Us: {PHONE_DISPLAY}</a>
                                </Button>
                                <Flex gap="2" align="center">
                                    <MapPin size={14} style={{ color: 'var(--gray-8)' }} />
                                    <Text size="2" color="gray">Serving {SERVICE_AREA}</Text>
                                </Flex>
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
                                <QuoteForm defaultService={service} />
                            )}
                        </Box>
                    </Grid>
                </Section>

            </Container>

            {/* Footer */}
            <Box py="6" style={{ backgroundColor: 'var(--gray-2)' }}>
                <Container size="3">
                    <Flex direction="column" align="center" gap="3">
                        <Flex gap="5" align="center" wrap="wrap" justify="center">
                            <Flex gap="2" align="center">
                                <Phone size={14} style={{ color: 'var(--gray-8)' }} />
                                <Text size="2" color="gray"><a href={PHONE_HREF} style={{ color: 'inherit', textDecoration: 'none' }}>{PHONE_DISPLAY}</a></Text>
                            </Flex>
                            <Flex gap="2" align="center">
                                <MapPin size={14} style={{ color: 'var(--gray-8)' }} />
                                <Text size="2" color="gray">{SERVICE_AREA}</Text>
                            </Flex>
                            <Link href="#quote" style={{ textDecoration: 'none' }}>
                                <Text size="2" color="gray" style={{ textDecoration: 'underline' }}>Get a Quote</Text>
                            </Link>
                        </Flex>
                        <Text align="center" color="gray" size="1">
                            &copy; {new Date().getFullYear()} Marotto Solutions. All rights reserved.
                        </Text>
                    </Flex>
                </Container>
            </Box>

            {/* Hover card styles */}
            <style>{`
                .hover-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px var(--gray-a4);
                }
            `}</style>
        </Box>
    );
}
