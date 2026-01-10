import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sprintsale.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

    const existingAdmin = await prisma.adminUser.findUnique({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        await prisma.adminUser.create({
            data: {
                email: adminEmail,
                passwordHash,
                name: 'Administrator',
            },
        });

        console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
        console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    }

    // Seed default services
    const services = [
        {
            name: 'OLX.pl',
            baseUrl: 'https://www.olx.pl',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/OLX_logo.svg/200px-OLX_logo.svg.png',
            defaultConfig: {
                searchUrlPattern: '/motoryzacja/samochody/?search[filter_float_price:from]={{priceMin}}&search[filter_float_price:to]={{priceMax}}&search[dist]=100',
                listingSelector: '[data-cy="l-card"]',
                titleSelector: 'h6',
                priceSelector: '[data-testid="ad-price"]',
            },
        },
        {
            name: 'OTOMOTO',
            baseUrl: 'https://www.otomoto.pl',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/OTOMOTO_logo.svg/200px-OTOMOTO_logo.svg.png',
            defaultConfig: {
                searchUrlPattern: '/osobowe?search[filter_float_price:from]={{priceMin}}&search[filter_float_price:to]={{priceMax}}',
                listingSelector: '[data-testid="listing-ad"]',
                titleSelector: 'h1',
                priceSelector: '[data-testid="ad-price"]',
            },
        },
        {
            name: 'Allegro Motoryzacja',
            baseUrl: 'https://allegro.pl/kategoria/samochody-osobowe-4029',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Allegro_logo.svg/200px-Allegro_logo.svg.png',
            defaultConfig: {
                searchUrlPattern: '?price_from={{priceMin}}&price_to={{priceMax}}',
                listingSelector: '[data-role="offer"]',
                titleSelector: 'h2',
                priceSelector: '[data-testid="price"]',
            },
        },
        {
            name: 'Facebook Marketplace',
            baseUrl: 'https://www.facebook.com/marketplace/category/vehicles',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Facebook_Messenger_logo_2020.svg/200px-Facebook_Messenger_logo_2020.svg.png',
            defaultConfig: {
                requiresLogin: true,
                searchUrlPattern: '/?minPrice={{priceMin}}&maxPrice={{priceMax}}',
                listingSelector: '[data-testid="marketplace-feed-item"]',
            },
        },
        {
            name: 'Sprzedajemy.pl',
            baseUrl: 'https://sprzedajemy.pl',
            logoUrl: null,
            defaultConfig: {
                searchUrlPattern: '/motoryzacja/samochody-osobowe/?inp_cena_od={{priceMin}}&inp_cena_do={{priceMax}}',
                listingSelector: '.offer',
                titleSelector: '.title',
                priceSelector: '.price',
            },
        },
    ];

    for (const service of services) {
        const existing = await prisma.service.findUnique({
            where: { name: service.name },
        });

        if (!existing) {
            await prisma.service.create({
                data: service,
            });
            console.log(`✅ Service created: ${service.name}`);
        } else {
            console.log(`ℹ️  Service already exists: ${service.name}`);
        }
    }

    console.log('');
    console.log('🎉 Database seed completed!');
    console.log('');
    console.log('Default admin credentials:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('⚠️  Please change the admin password after first login!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
