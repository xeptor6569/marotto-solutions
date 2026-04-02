const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@cameronmarotto.com';
    const password = 'TemporaryPassword123!'; // User should change this

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
            name: 'Cameron Marotto',
            password: hashedPassword,
            role: 'admin'
        }
    });

    console.log(`Success! User ${user.email} created/updated.`);
    console.log(`Login Email: ${email}`);
    console.log(`Login Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
