import { PrismaClient, NutritionStatus, Restaurant } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SALT_ROUNDS = 10;

async function hash(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('Seeding database...');

  // Super Admin — the ONLY way this account is ever created, no registration endpoint exists.
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@nutridash.dev' },
    update: {},
    create: {
      email: 'superadmin@nutridash.dev',
      passwordHash: await hash('SuperAdmin123!'),
      name: 'Platform Super Admin',
      role: 'SUPER_ADMIN',
      isOnboardingComplete: true,
    },
  });
  console.log(`Super Admin created: ${superAdmin.email}`);

  // Restaurants + their admin accounts
  const restaurantData = [
    {
      name: 'Himalayan Greens',
      cuisine: 'Nepali',
      address: 'Thamel, Kathmandu',
      adminEmail: 'admin@himalayangreens.dev',
    },
    {
      name: 'Spice Route Kitchen',
      cuisine: 'Indian',
      address: 'Lazimpat, Kathmandu',
      adminEmail: 'admin@spiceroute.dev',
    },
    {
      name: 'Newari Bhoj',
      cuisine: 'Newari',
      address: 'Patan Durbar Square, Lalitpur',
      adminEmail: 'admin@newaribhoj.dev',
    },
    {
      name: 'Green Bowl Cafe',
      cuisine: 'Healthy / Salads',
      address: 'Baluwatar, Kathmandu',
      adminEmail: 'admin@greenbowl.dev',
    },
    {
      name: 'Momo Junction',
      cuisine: 'Street Food',
      address: 'New Road, Kathmandu',
      adminEmail: 'admin@momojunction.dev',
    },
  ];

  const restaurants: Restaurant[] = [];
  for (const r of restaurantData) {
    const restaurant = await prisma.restaurant.upsert({
      where: { id: r.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: r.name.toLowerCase().replace(/\s+/g, '-'),
        name: r.name,
        cuisine: r.cuisine,
        address: r.address,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: r.adminEmail },
      update: {},
      create: {
        email: r.adminEmail,
        passwordHash: await hash('RestaurantAdmin123!'),
        name: `${r.name} Admin`,
        role: 'RESTAURANT_ADMIN',
        isOnboardingComplete: true,
        restaurantId: restaurant.id,
      },
    });

    restaurants.push(restaurant);
    console.log(`Restaurant created: ${restaurant.name} (admin: ${r.adminEmail})`);
  }

  // Menu items — 4 per restaurant = 20 total, each with nutrition info attached
  const menuItemsByRestaurant: Record<
    string,
    Array<{
      name: string;
      description: string;
      priceRs: number;
      category: string;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      fiberG: number;
      allergens: string[];
      servingSize: string;
    }>
  > = {
    'himalayan-greens': [
      { name: 'Dal Bhat Set', description: 'Lentil soup, rice, vegetable curry, pickle', priceRs: 350, category: 'Main', calories: 650, proteinG: 22, carbsG: 110, fatG: 12, fiberG: 14, allergens: [], servingSize: '1 plate (450g)' },
      { name: 'Gundruk Soup', description: 'Fermented leafy green soup', priceRs: 150, category: 'Snack', calories: 90, proteinG: 4, carbsG: 12, fatG: 2, fiberG: 5, allergens: [], servingSize: '1 bowl (200ml)' },
      { name: 'Sel Roti', description: 'Traditional rice flour ring bread', priceRs: 80, category: 'Snack', calories: 220, proteinG: 3, carbsG: 38, fatG: 6, fiberG: 1, allergens: ['GLUTEN'], servingSize: '2 pieces' },
      { name: 'Masala Chiya', description: 'Spiced milk tea', priceRs: 50, category: 'Drink', calories: 110, proteinG: 3, carbsG: 16, fatG: 4, fiberG: 0, allergens: ['DAIRY'], servingSize: '1 cup (200ml)' },
    ],
    'spice-route-kitchen': [
      { name: 'Butter Chicken', description: 'Chicken in creamy tomato gravy', priceRs: 420, category: 'Main', calories: 590, proteinG: 34, carbsG: 18, fatG: 38, fiberG: 3, allergens: ['DAIRY'], servingSize: '1 bowl (300g)' },
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese skewers', priceRs: 320, category: 'Main', calories: 410, proteinG: 24, carbsG: 12, fatG: 28, fiberG: 2, allergens: ['DAIRY'], servingSize: '6 pieces' },
      { name: 'Garlic Naan', description: 'Tandoor-baked flatbread with garlic', priceRs: 90, category: 'Snack', calories: 260, proteinG: 7, carbsG: 42, fatG: 7, fiberG: 2, allergens: ['GLUTEN', 'DAIRY'], servingSize: '1 piece' },
      { name: 'Mango Lassi', description: 'Sweet yogurt mango drink', priceRs: 150, category: 'Drink', calories: 230, proteinG: 6, carbsG: 38, fatG: 5, fiberG: 1, allergens: ['DAIRY'], servingSize: '1 glass (300ml)' },
    ],
    'newari-bhoj': [
      { name: 'Yomari', description: 'Steamed rice flour dumpling with molasses filling', priceRs: 120, category: 'Dessert', calories: 280, proteinG: 4, carbsG: 56, fatG: 4, fiberG: 2, allergens: [], servingSize: '2 pieces' },
      { name: 'Choila', description: 'Spiced grilled buffalo meat', priceRs: 380, category: 'Main', calories: 480, proteinG: 38, carbsG: 6, fatG: 32, fiberG: 1, allergens: [], servingSize: '1 plate (250g)' },
      { name: 'Bara', description: 'Lentil flour pancake', priceRs: 140, category: 'Snack', calories: 240, proteinG: 11, carbsG: 28, fatG: 9, fiberG: 5, allergens: [], servingSize: '2 pieces' },
      { name: 'Thwon (Local Rice Wine)', description: 'Traditional fermented rice beverage', priceRs: 100, category: 'Drink', calories: 150, proteinG: 1, carbsG: 18, fatG: 0, fiberG: 0, allergens: [], servingSize: '1 glass (250ml)' },
    ],
    'green-bowl-cafe': [
      { name: 'Quinoa Power Bowl', description: 'Quinoa, chickpeas, avocado, greens', priceRs: 380, category: 'Main', calories: 420, proteinG: 16, carbsG: 52, fatG: 16, fiberG: 12, allergens: [], servingSize: '1 bowl (350g)' },
      { name: 'Grilled Chicken Salad', description: 'Mixed greens, grilled chicken, vinaigrette', priceRs: 360, category: 'Main', calories: 380, proteinG: 32, carbsG: 14, fatG: 20, fiberG: 6, allergens: [], servingSize: '1 bowl (300g)' },
      { name: 'Green Smoothie', description: 'Spinach, banana, almond milk', priceRs: 180, category: 'Drink', calories: 190, proteinG: 5, carbsG: 34, fatG: 4, fiberG: 6, allergens: ['NUTS'], servingSize: '1 glass (350ml)' },
      { name: 'Roasted Veggie Wrap', description: 'Whole wheat wrap, roasted vegetables, hummus', priceRs: 290, category: 'Snack', calories: 340, proteinG: 10, carbsG: 48, fatG: 12, fiberG: 9, allergens: ['GLUTEN'], servingSize: '1 wrap' },
    ],
    'momo-junction': [
      { name: 'Chicken Steam Momo', description: 'Steamed chicken dumplings, 10 pieces', priceRs: 200, category: 'Main', calories: 360, proteinG: 22, carbsG: 44, fatG: 9, fiberG: 2, allergens: ['GLUTEN'], servingSize: '10 pieces' },
      { name: 'Veg Fried Momo', description: 'Pan-fried vegetable dumplings, 10 pieces', priceRs: 180, category: 'Main', calories: 410, proteinG: 9, carbsG: 50, fatG: 18, fiberG: 4, allergens: ['GLUTEN'], servingSize: '10 pieces' },
      { name: 'Chatpate', description: 'Spicy puffed rice snack mix', priceRs: 100, category: 'Snack', calories: 250, proteinG: 5, carbsG: 38, fatG: 9, fiberG: 3, allergens: [], servingSize: '1 bowl (150g)' },
      { name: 'Lemon Iced Tea', description: 'Chilled lemon black tea', priceRs: 80, category: 'Drink', calories: 90, proteinG: 0, carbsG: 22, fatG: 0, fiberG: 0, allergens: [], servingSize: '1 glass (300ml)' },
    ],
  };

  let itemCount = 0;
  for (const restaurant of restaurants) {
    const items = menuItemsByRestaurant[restaurant.id];
    for (const item of items) {
      const menuItem = await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          name: item.name,
          description: item.description,
          priceRs: item.priceRs,
          category: item.category,
          isAvailable: true,
          nutritionStatus: NutritionStatus.FETCHED,
          nutrition: {
            create: {
              calories: item.calories,
              proteinG: item.proteinG,
              carbsG: item.carbsG,
              fatG: item.fatG,
              fiberG: item.fiberG,
              allergens: item.allergens,
              servingSize: item.servingSize,
            },
          },
        },
      });
      itemCount++;
      console.log(`  - ${menuItem.name}`);
    }
  }

  console.log(`${itemCount} menu items created across ${restaurants.length} restaurants`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });