import { randomInt } from 'crypto';

/** OTP lifetime for email sign-in codes. */
export const EMAIL_OTP_MAX_AGE_SECONDS = 10 * 60;

export function generateEmailOtp(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
}
