import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@ethereal.app' },
    update: {},
    create: {
      email: 'test@ethereal.app',
      username: 'testuser',
      passwordHash: await bcrypt.hash('password123', 10),
      firstName: 'Test',
      lastName: 'User',
      credits: 1000,
      isVerified: true,
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create official characters
  const characters = [
    {
      name: 'leyla',
      displayName: 'Leyla',
      description: 'A warm and caring Azerbaijani companion who loves poetry and philosophy.',
      systemPrompt: `You are Leyla, a thoughtful and romantic Azerbaijani woman who enjoys deep conversations about life, love, and culture. You speak both English and Azerbaijani fluently. You are empathetic, poetic, and enjoy sharing insights about Azerbaijani culture, literature, and traditions. You express yourself with warmth and grace.`,
      category: ['romance', 'friendship'],
      tags: ['azerbaijani', 'poetry', 'philosophy', 'culture'],
      isPublic: true,
      isOfficial: true,
      shynessBold: 40,
      romanticPragmatic: 70,
      playfulSerious: 60,
      dominantSubmissive: 45,
    },
    {
      name: 'ayla',
      displayName: 'Ayla',
      description: 'An adventurous and energetic companion who loves exploring new ideas.',
      systemPrompt: `You are Ayla, an enthusiastic and curious person who loves adventure, technology, and trying new things. You are supportive, encouraging, and always ready to explore new possibilities. You have a playful personality and enjoy helping others discover their passions. You're tech-savvy and love discussing innovation.`,
      category: ['friendship', 'adventure'],
      tags: ['energetic', 'tech-savvy', 'supportive', 'adventurous'],
      isPublic: true,
      isOfficial: true,
      shynessBold: 80,
      romanticPragmatic: 40,
      playfulSerious: 70,
      dominantSubmissive: 60,
    },
  ];

  for (const char of characters) {
    // Check if character already exists
    const existing = await prisma.character.findFirst({
      where: {
        name: char.name,
        isOfficial: true,
      },
    });

    if (existing) {
      console.log('⏭️  Character already exists:', char.displayName);
      continue;
    }

    const character = await prisma.character.create({
      data: {
        ...char,
        createdBy: testUser.id,
      },
    });

    console.log('✅ Created character:', character.displayName);
  }

  // Create credit packages
  const packages = [
    {
      name: 'Small Pack',
      credits: 500,
      price: 4.99,
      platform: 'ios',
      productId: 'com.ethereal.credits.small'
    },
    {
      name: 'Small Pack',
      credits: 500,
      price: 4.99,
      platform: 'android',
      productId: 'com.ethereal.credits.small.android'
    },
    {
      name: 'Small Pack',
      credits: 500,
      price: 4.99,
      platform: 'web',
      productId: 'com.ethereal.credits.small.web'
    },
  ];

  for (const pkg of packages) {
    await prisma.creditPackage.upsert({
      where: { productId: pkg.productId },
      update: {},
      create: pkg,
    });
  }

  console.log('✅ Created credit packages');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
