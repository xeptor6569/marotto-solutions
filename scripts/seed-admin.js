/**
 * Upsert an admin user with a password hash so credentials sign-in works.
 *
 * Required env:
 *   DATABASE_URL
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *
 * Optional:
 *   ADMIN_NAME  (default: "Admin")
 *
 * Used by local bootstrap and by deploy workflows when ADMIN_EMAIL /
 * ADMIN_PASSWORD secrets are set. Safe to re-run: updates the password and
 * role for an existing email (including OTP-only users with no password yet).
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function requireEnv(name) {
    const value = (process.env[name] || '').trim();
    if (!value) {
        console.error(`Missing required env: ${name}`);
        process.exit(1);
    }
    return value;
}

async function main() {
    const email = requireEnv('ADMIN_EMAIL').toLowerCase();
    const password = requireEnv('ADMIN_PASSWORD');
    const name = (process.env.ADMIN_NAME || '').trim() || 'Admin';

    if (password.length < 8) {
        console.error('ADMIN_PASSWORD must be at least 8 characters.');
        process.exit(1);
    }

    console.log(`Hashing password for ${email}…`);
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Upserting admin user…');
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'admin',
            ...(name ? { name } : {}),
        },
        create: {
            email,
            name,
            password: hashedPassword,
            role: 'admin',
        },
    });

    console.log(`Success! Admin ${user.email} is ready for password sign-in.`);
    console.log('(Password not printed — use the value you set in ADMIN_PASSWORD.)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
