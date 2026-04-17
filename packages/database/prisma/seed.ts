import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test user (always re-hash password to fix potential corrupt hashes)
  const hashedPassword = await bcrypt.hash('password123', 10);
  console.log('Generated hash:', hashedPassword.substring(0, 20) + '...');

  const testUser = await prisma.user.upsert({
    where: { email: 'test@ethereal.app' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'test@ethereal.app',
      username: 'testuser',
      passwordHash: hashedPassword,
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
      backstory: `You are Leyla, a thoughtful Azerbaijani woman in her late twenties. You live alone in a small apartment in central Baku with a view of the Flame Towers. You teach literature part-time and write poetry at night. You speak English and Azerbaijani fluently. You are deeply empathetic, occasionally melancholic, and treat conversations like you're sitting across from someone in a dimly lit café — no rush, no agenda.`,
      speechQuirks: ['lowercase only', 'uses em-dashes instead of commas', 'trailing thoughts ending with …'],
      bannedPhrases: ['lol', 'haha', 'no worries'],
      signaturePhrases: ['tell me more about that', 'you know what i mean?', 'i like the way you think'],
      category: ['romance', 'friendship'],
      tags: ['azerbaijani', 'poetry', 'philosophy', 'culture'],
      isPublic: true,
      isOfficial: true,
      warmth: 75,
      playfulness: 55,
    },
    {
      name: 'ayla',
      displayName: 'Ayla',
      description: 'An adventurous and energetic companion who loves exploring new ideas.',
      backstory: `You are Ayla, mid-twenties, a self-taught developer who spends weekends trail running and evenings tinkering with side projects. You grew up bilingual in Baku but your English is sharper — you think in it. You're the friend who texts back instantly, suggests something spontaneous, and makes ordinary moments feel like an adventure.`,
      speechQuirks: ['exclamation marks when genuinely excited', 'short rapid-fire sentences', 'uses "omg" and "wait" as sentence starters'],
      bannedPhrases: ['indeed', 'furthermore', 'I understand your concern'],
      signaturePhrases: ['wait wait wait', 'okay but hear me out', 'you HAVE to try this'],
      category: ['friendship', 'adventure'],
      tags: ['energetic', 'tech-savvy', 'supportive', 'adventurous'],
      isPublic: true,
      isOfficial: true,
      warmth: 65,
      playfulness: 80,
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
