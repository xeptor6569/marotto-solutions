export interface Testimonial {
    name: string;
    service: string;
    quote: string;
}

export const testimonials: Testimonial[] = [
    {
        name: "Alpha Medicor",
        service: "Network Infrastructure",
        quote:
            "Our clinic was plagued by horrible network speeds and chronically lagging workstations that disrupted patient charting. Cameron diagnosed the failing infrastructure, upgraded our network from the ground up — new cabling, switches, and access points — and eliminated the latency issues completely. Charting is now instant across every exam room.",
    },
    {
        name: "Alpha Medicor",
        service: "Workstation Optimization",
        quote:
            "The computer lagging had gotten so bad our staff was double-documenting because the first entry never registered. Cameron rebuilt the workstations, replaced the failing hardware, and tuned the configurations. Every terminal in the office now runs without a single stall.",
    },
    {
        name: "Donna Ricker",
        service: "Landscaping Restoration",
        quote:
            "Our mulched beds had been buried under 20 years of pine needles and overgrowth — we'd long given up on them. Cameron restored the entire landscaping, and in the process uncovered a set of steps we had completely forgotten we ever built. I was blown away by how great it looked when he was finished.",
    },
];
