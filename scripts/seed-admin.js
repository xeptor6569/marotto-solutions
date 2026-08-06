const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Usage:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... [ADMIN_NAME="Your Name"] node scripts/seed-admin.js
// When ADMIN_PASSWORD is omitted a random one is generated and printed once.
async function main() {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (!email) {
        console.error('ADMIN_EMAIL is required. Example:');
        console.error('  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me node scripts/seed-admin.js');
        process.exit(1);
    }

    const name = (process.env.ADMIN_NAME || '').trim() || email.split('@')[0];
    const providedPassword = (process.env.ADMIN_PASSWORD || '').trim();
    const password = providedPassword || crypto.randomBytes(12).toString('base64url');

    console.log(`Hashing password for ${email}...`);
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Upserting user...`);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'admin'
        },
        create: {
            email,
            name,
            password: hashedPassword,
            role: 'admin'
        }
    });

    console.log(`Success! User ${user.email} created/updated.`);
    console.log(`Login Email: ${email}`);
    if (providedPassword) {
        console.log('Login Password: (the ADMIN_PASSWORD you provided)');
    } else {
        console.log(`Login Password (generated — store it now): ${password}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
