import { describe, expect, it } from 'vitest';
import { EMAIL_OTP_MAX_AGE_SECONDS, generateEmailOtp } from '@/lib/email-otp';

describe('generateEmailOtp', () => {
    it('returns a 6-digit numeric string', () => {
        for (let i = 0; i < 20; i += 1) {
            const code = generateEmailOtp();
            expect(code).toMatch(/^\d{6}$/);
        }
    });

    it('always returns length 6', () => {
        expect(generateEmailOtp()).toHaveLength(6);
    });
});

describe('EMAIL_OTP_MAX_AGE_SECONDS', () => {
    it('is 10 minutes', () => {
        expect(EMAIL_OTP_MAX_AGE_SECONDS).toBe(600);
    });
});
