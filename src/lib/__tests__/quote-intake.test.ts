import { describe, expect, it } from 'vitest';
import { formatQuoteIntakeNote, serviceLabel } from '@/lib/quote-intake';

describe('quote request intake', () => {
    it('includes contact and project details in the prospect note', () => {
        const note = formatQuoteIntakeNote({
            name: 'Jane Customer',
            email: 'jane@example.com',
            phone: '(570) 555-0123',
            service: 'it',
            date: 'Next Tuesday',
            details: 'Improve Wi-Fi coverage in the office.',
        });

        expect(note).toContain('Service: IT / Networking');
        expect(note).toContain('Phone: (570) 555-0123');
        expect(note).toContain('Preferred schedule: Next Tuesday');
        expect(note).toContain('Details: Improve Wi-Fi coverage in the office.');
    });

    it('keeps a custom service name readable', () => {
        expect(serviceLabel('Special project')).toBe('Special project');
    });
});
