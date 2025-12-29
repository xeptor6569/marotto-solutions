import { Container, Heading, Text, Flex, Button, Card, Grid, Box, Section, Separator } from "@radix-ui/themes";
import Link from 'next/link';
import { ArrowRight, Hammer, Monitor, Cpu, Code } from "lucide-react";
import QuoteForm from "./components/QuoteForm";

export default async function Home({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
    const { submitted } = await searchParams;

    return (
        <Box>
            {/* Navigation / Header */}
            <Flex px="5" py="4" justify="between" align="center" style={{ borderBottom: '1px solid var(--gray-5)' }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Heading size="5">Marotto Solutions</Heading>
                </Link>
                <Flex gap="4">
                    {/* Hide Portal button in production builds, visible only in dev or if configured */}
                    {process.env.NODE_ENV !== 'production' && (
                        <Button variant="ghost" asChild>
                            <Link href="/dashboard">Client Portal</Link>
                        </Button>
                    )}
                </Flex>
            </Flex>

            <Container size="3">
                {/* Hero Section */}
                <Section size="3">
                    <Flex direction="column" align="center" gap="5" style={{ textAlign: 'center' }}>
                        <Heading size="9" style={{ maxWidth: 800 }}>
                            Expert General Contracting & IT Services
                        </Heading>
                        <Text size="5" color="gray" style={{ maxWidth: 600 }}>
                            From home renovations to custom PC builds and networking. One partner for your physical and digital infrastructure.
                        </Text>
                        <Flex gap="3" mt="4">
                            <Button size="4" asChild>
                                <Link href="#quote">Get a Quote <ArrowRight /></Link>
                            </Button>
                            <Button size="4" variant="soft" asChild>
                                <Link href="#services">View Services</Link>
                            </Button>
                        </Flex>
                    </Flex>
                </Section>

                <Separator size="4" />

                {/* Services Section */}
                <Section size="3" id="services">
                    <Heading size="7" mb="5" align="center">Our Services</Heading>
                    <Grid columns={{ initial: '1', sm: '2' }} gap="5">
                        <Card size="3">
                            <Flex gap="3" align="center" mb="2">
                                <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                    <Hammer size={24} color="var(--accent-9)" />
                                </Box>
                                <Heading size="4">General Contracting</Heading>
                            </Flex>
                            <Text color="gray">
                                Home repairs, renovations, and custom installations. Professional craftsmanship for your property needs.
                            </Text>
                        </Card>

                        <Card size="3">
                            <Flex gap="3" align="center" mb="2">
                                <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                    <Monitor size={24} color="var(--accent-9)" />
                                </Box>
                                <Heading size="4">IT & Networking</Heading>
                            </Flex>
                            <Text color="gray">
                                Home and small business networking, WiFi optimization, firewall configuration, and troubleshooting.
                            </Text>
                        </Card>

                        <Card size="3">
                            <Flex gap="3" align="center" mb="2">
                                <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                    <Cpu size={24} color="var(--accent-9)" />
                                </Box>
                                <Heading size="4">Custom PC Building</Heading>
                            </Flex>
                            <Text color="gray">
                                High-performance workstations and gaming rigs tailored to your specific requirements and budget.
                            </Text>
                        </Card>

                        <Card size="3">
                            <Flex gap="3" align="center" mb="2">
                                <Box p="2" style={{ backgroundColor: 'var(--accent-3)', borderRadius: '50%' }}>
                                    <Code size={24} color="var(--accent-9)" />
                                </Box>
                                <Heading size="4">Programming & Automation</Heading>
                            </Flex>
                            <Text color="gray">
                                Custom scripts, small web applications, and automation solutions to streamline your workflows.
                            </Text>
                        </Card>
                    </Grid>
                </Section>

                <Separator size="4" />

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
                        </Box>
                        <Box>
                            {submitted ? (
                                <Card size="3" style={{ backgroundColor: 'var(--green-3)' }}>
                                    <Flex direction="column" align="center" py="5" gap="3">
                                        <Heading size="5" color="green">Variable Received!</Heading>
                                        <Text align="center">Thank you for your request. We will be in touch shortly.</Text>
                                        <Button variant="outline" asChild>
                                            <Link href="/">Submit Another</Link>
                                        </Button>
                                    </Flex>
                                </Card>
                            ) : (
                                <QuoteForm />
                            )}
                        </Box>
                    </Grid>
                </Section>

            </Container>

            {/* Footer */}
            <Box py="5" style={{ backgroundColor: 'var(--gray-2)' }}>
                <Container size="3">
                    <Text align="center" color="gray" size="2">
                        &copy; {new Date().getFullYear()} Marotto Solutions. All rights reserved.
                    </Text>
                </Container>
            </Box>
        </Box>
    );
}
