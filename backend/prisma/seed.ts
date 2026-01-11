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
        {
            name: 'Autoplac.pl',
            baseUrl: 'https://www.autoplac.pl',
            logoUrl: null,
            defaultConfig: {
                searchUrlPattern: '/samochody-osobowe/?cena_od={{priceMin}}&cena_do={{priceMax}}',
                listingSelector: '.offer-item',
                titleSelector: '.offer-title',
                priceSelector: '.offer-price',
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

    // Seed Subscription Plans
    console.log('\n📋 Seeding subscription plans...');

    const plans = [
        {
            name: 'FREE',
            displayName: 'Darmowy',
            description: 'Podstawowy plan dla każdego - testuj SprintSale za darmo!',
            priceMonthly: 0,
            priceQuarterly: 0,
            priceYearly: 0,
            maxServices: 1,
            maxCustomServices: 0,
            maxSearchConfigs: 1,
            dailySearchMinutes: 120,  // 2 hours
            maxNotificationsDay: 2,
            canAddCustomService: false,
            hasBonusService: false,
            hasEmailReports: false,
            hasPrioritySupport: false,
            displayOrder: 0,
        },
        {
            name: 'PREMIUM',
            displayName: 'Premium',
            description: 'Odblokuj pełen potencjał SprintSale - nielimitowane wyszukiwania i powiadomienia!',
            priceMonthly: 49.99,
            priceQuarterly: 129.99,  // ~43.33/mo
            priceYearly: 399.99,     // ~33.33/mo
            maxServices: 0,  // 0 = unlimited
            maxCustomServices: 1,
            maxSearchConfigs: 0,  // 0 = unlimited
            dailySearchMinutes: 0,  // 0 = unlimited
            maxNotificationsDay: 0,  // 0 = unlimited
            canAddCustomService: true,
            hasBonusService: true,
            hasEmailReports: true,
            hasPrioritySupport: true,
            displayOrder: 1,
        },
    ];

    for (const plan of plans) {
        const existing = await prisma.subscriptionPlan.findUnique({
            where: { name: plan.name },
        });

        if (!existing) {
            await prisma.subscriptionPlan.create({
                data: plan,
            });
            console.log(`✅ Plan created: ${plan.displayName}`);
        } else {
            console.log(`ℹ️  Plan already exists: ${plan.displayName}`);
        }
    }

    // Get FREE plan for admin user
    const freePlan = await prisma.subscriptionPlan.findUnique({
        where: { name: 'FREE' },
    });

    // Update admin to have isAdmin flag and plan
    if (freePlan) {
        await prisma.user.updateMany({
            where: { email: adminEmail },
            data: {
                isAdmin: true,
                planId: freePlan.id,
            },
        });
        console.log(`✅ Admin user updated with isAdmin flag and FREE plan`);
    }

    // Seed Legal Pages
    console.log('\n📄 Seeding legal pages...');

    const legalPages = [
        {
            slug: 'privacy-policy',
            title: 'Polityka Prywatności',
            content: `# Polityka Prywatności SprintSale

## 1. Administrator danych

Administratorem Twoich danych osobowych jest SprintSale.

## 2. Jakie dane zbieramy

- Adres email
- Imię i nazwisko (opcjonalnie)
- Dane logowania do serwisów ogłoszeniowych (szyfrowane)
- Historia wyszukiwań i powiadomień

## 3. Cel przetwarzania

Twoje dane przetwarzamy w celu:
- Świadczenia usługi monitorowania ogłoszeń
- Wysyłania powiadomień o nowych ogłoszeniach
- Poprawy jakości usługi

## 4. Bezpieczeństwo

Wszystkie dane są szyfrowane przy użyciu algorytmu AES-256.

## 5. Twoje prawa

Masz prawo do:
- Dostępu do swoich danych
- Poprawiania danych
- Usunięcia konta i danych
- Przenoszenia danych

## 6. Kontakt

W sprawie danych osobowych skontaktuj się: privacy@sprintsale.pl`,
            isPublished: true,
        },
        {
            slug: 'terms-of-service',
            title: 'Regulamin Usługi',
            content: `# Regulamin Usługi SprintSale

## 1. Definicje

- **Usługa** - SprintSale, platforma do monitorowania ogłoszeń samochodowych
- **Użytkownik** - osoba korzystająca z Usługi
- **Konto** - indywidualne konto Użytkownika

## 2. Zasady korzystania

2.1. Usługa jest przeznaczona dla osób pełnoletnich.

2.2. Użytkownik zobowiązuje się do:
- Podania prawdziwych danych
- Nieudostępniania konta innym osobom
- Korzystania z Usługi zgodnie z prawem

## 3. Plany i płatności

3.1. **Plan Darmowy** - ograniczony dostęp, 1 serwis, 2h/dzień, 2 powiadomienia/dzień

3.2. **Plan Premium** - pełny dostęp, nielimitowane funkcje

3.3. Płatności są realizowane przez bezpieczne bramki płatnicze.

## 4. Odpowiedzialność

4.1. SprintSale nie ponosi odpowiedzialności za:
- Treść ogłoszeń z serwisów zewnętrznych
- Straty wynikające z decyzji zakupowych
- Przerwy w działaniu serwisów zewnętrznych

## 5. Zmiany regulaminu

O zmianach regulaminu poinformujemy drogą mailową z 14-dniowym wyprzedzeniem.

## 6. Kontakt

Pytania: support@sprintsale.pl`,
            isPublished: true,
        },
    ];

    for (const page of legalPages) {
        const existing = await prisma.legalPage.findUnique({
            where: { slug: page.slug },
        });

        if (!existing) {
            await prisma.legalPage.create({
                data: page,
            });
            console.log(`✅ Legal page created: ${page.title}`);
        } else {
            console.log(`ℹ️  Legal page already exists: ${page.title}`);
        }
    }

    // Seed App Settings
    console.log('\n⚙️  Seeding app settings...');

    const appSettings = [
        { key: 'app.name', value: 'SprintSale', description: 'Nazwa aplikacji', isPublic: true },
        { key: 'app.description', value: 'Automatyczne monitorowanie ogłoszeń samochodowych', description: 'Opis aplikacji', isPublic: true },
        { key: 'app.contact_email', value: 'support@sprintsale.pl', description: 'Email kontaktowy', isPublic: true },
        { key: 'subscription.grace_period_days', value: '2', description: 'Dni karencji po wygaśnięciu subskrypcji', isPublic: false },
        { key: 'subscription.reminder_days', value: '10,5,1', description: 'Dni przed wygaśnięciem do wysłania przypomnienia', isPublic: false },
        { key: 'notifications.email_enabled', value: 'true', description: 'Czy emaile są włączone', isPublic: false },
    ];

    for (const setting of appSettings) {
        const existing = await prisma.appSettings.findUnique({
            where: { key: setting.key },
        });

        if (!existing) {
            await prisma.appSettings.create({
                data: setting,
            });
            console.log(`✅ Setting created: ${setting.key}`);
        } else {
            console.log(`ℹ️  Setting already exists: ${setting.key}`);
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
