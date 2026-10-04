import { describe, expect, it } from 'vitest';
import { buildOnboardingChecklist, type OnboardingSignals } from '@/lib/onboarding';

const fresh: OnboardingSignals = {
    businessName: 'Acme',
    hasContactDetails: false,
    hasAddress: false,
    hasLogo: false,
    customizedTheme: false,
    emailConfigured: false,
    paymentsConfigured: false,
    clientCount: 0,
    jobCount: 0,
    issuedDocumentCount: 0,
};

describe('buildOnboardingChecklist', () => {
    it('a fresh install has nothing done and points at the profile first', () => {
        const checklist = buildOnboardingChecklist(fresh);
        expect(checklist.completed).toBe(0);
        expect(checklist.total).toBe(7);
        expect(checklist.next?.id).toBe('profile');
        expect(checklist.allDone).toBe(false);
    });

    it('profile needs name, contact, and address together', () => {
        const partial = buildOnboardingChecklist({ ...fresh, hasContactDetails: true });
        expect(partial.steps.find((s) => s.id === 'profile')?.done).toBe(false);
        const complete = buildOnboardingChecklist({ ...fresh, hasContactDetails: true, hasAddress: true });
        expect(complete.steps.find((s) => s.id === 'profile')?.done).toBe(true);
        expect(complete.next?.id).toBe('brand');
    });

    it('either a logo or a customized theme counts as branding', () => {
        expect(buildOnboardingChecklist({ ...fresh, hasLogo: true }).steps.find((s) => s.id === 'brand')?.done).toBe(true);
        expect(buildOnboardingChecklist({ ...fresh, customizedTheme: true }).steps.find((s) => s.id === 'brand')?.done).toBe(true);
    });

    it('reports allDone with no next step when everything is set', () => {
        const checklist = buildOnboardingChecklist({
            businessName: 'Acme',
            hasContactDetails: true,
            hasAddress: true,
            hasLogo: true,
            customizedTheme: false,
            emailConfigured: true,
            paymentsConfigured: true,
            clientCount: 3,
            jobCount: 1,
            issuedDocumentCount: 2,
        });
        expect(checklist.allDone).toBe(true);
        expect(checklist.next).toBeNull();
        expect(checklist.steps.every((s) => s.href.startsWith('/admin'))).toBe(true);
    });
});
