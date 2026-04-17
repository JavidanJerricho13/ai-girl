import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/services/prisma.service';
import { FalService, type GenerateImageParams } from '../../../integrations/fal/fal.service';
import { StorageService } from '../../../common/services/storage.service';
import { GroqService } from '../../../integrations/groq/groq.service';

export interface StudioInput {
  archetype: string;   // e.g. "mysterious bookworm", "sporty extrovert"
  keywords: string[];  // e.g. ["warm", "teasing", "night owl"]
  createdBy: string;   // admin userId
}

export interface GeneratedPersona {
  name: string;
  displayName: string;
  description: string;
  backstory: string;
  speechQuirks: string[];
  signaturePhrases: string[];
  bannedPhrases: string[];
  warmth: number;
  playfulness: number;
  visualDescriptor: string;
}

export interface VisualDNA {
  seed: number;
  basePrompt: string;
  imageUrl: string;
  width: number;
  height: number;
}

// Scene variations for gallery auto-gen. Each is a setting the character
// can appear in — varied enough to showcase different moods while the
// locked seed + base prompt keep her visually recognizable.
const GALLERY_SCENES = [
  'candlelit café at night, warm amber lighting, leaning chin on hand',
  'morning sunlight through curtains, messy hair, holding coffee mug',
  'rainy city street, umbrella, looking over shoulder, wet reflections',
  'beach sunset, golden hour, sitting on sand, barefoot',
  'neon-lit rooftop at night, city skyline behind, relaxed pose',
  'autumn park, fallen leaves, scarf, soft smile',
  'bookshop aisle, reading glasses, natural light from window',
  'gym / yoga, sporty outfit, dynamic pose, clean background',
  'cozy bed with fairy lights, evening, soft fabrics, intimate',
  'studio portrait, dramatic side lighting, minimal background',
  'garden flowers, spring day, light dress, looking at camera',
  'winter evening, cozy sweater, fireplace glow, hands around mug',
];

@Injectable()
export class CharacterGeneratorService {
  private readonly logger = new Logger(CharacterGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fal: FalService,
    private readonly storage: StorageService,
    private readonly groq: GroqService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Step 1: LLM generates a structured persona from archetype + keywords.
   * Returns the persona fields + a visual descriptor the image gen can use.
   */
  async generatePersona(input: StudioInput): Promise<GeneratedPersona> {
    const prompt = [
      `Create a fictional female character for a companion app.`,
      `Archetype: ${input.archetype}`,
      `Keywords: ${input.keywords.join(', ')}`,
      '',
      'Return ONLY valid JSON with these exact fields (no markdown, no explanation):',
      '{',
      '  "name": "snake_case_id",',
      '  "displayName": "First name only",',
      '  "description": "2 sentences, user-facing bio",',
      '  "backstory": "3-4 paragraphs, second person (You are...), vivid situational details",',
      '  "speechQuirks": ["3 speech habits, e.g. lowercase only"],',
      '  "signaturePhrases": ["2-3 phrases she repeats"],',
      '  "bannedPhrases": ["2 phrases she would never say"],',
      '  "warmth": 0-100,',
      '  "playfulness": 0-100,',
      '  "visualDescriptor": "1 sentence: hair color, skin tone, eye color, age range, distinguishing feature"',
      '}',
    ].join('\n');

    const result = await this.groq.generateWithTools({
      systemPrompt: 'You are a character design assistant. Output only valid JSON.',
      userMessage: prompt,
    });

    try {
      const parsed = JSON.parse(result.content) as GeneratedPersona;
      if (!parsed.name || !parsed.backstory || !parsed.visualDescriptor) {
        throw new Error('Missing required fields');
      }
      return parsed;
    } catch (err) {
      this.logger.error(`Persona parse failed: ${result.content?.slice(0, 200)}`);
      throw new BadRequestException('LLM returned invalid persona JSON. Try again.');
    }
  }

  /**
   * Step 2: Generate a profile image from the visual descriptor. Picks a
   * random seed; the admin selects the best candidate and we lock it.
   */
  async generateCandidateImages(
    visualDescriptor: string,
    count = 4,
  ): Promise<Array<{ url: string; seed: number; width: number; height: number }>> {
    const candidates = await Promise.all(
      Array.from({ length: count }, async () => {
        const seed = Math.floor(Math.random() * 2_000_000_000);
        const prompt = `portrait photo, ${visualDescriptor}, soft cinematic lighting, shallow depth of field, high quality`;
        const result = await this.fal.generateImage({
          prompt,
          imageSize: 'portrait_4_3',
          seed,
          enableSafetyChecker: true,
        });
        return { url: result.url, seed, width: result.width, height: result.height };
      }),
    );
    return candidates;
  }

  /**
   * Step 3: Lock Visual DNA — admin picks one candidate, we persist the
   * seed + base prompt so future gallery images stay visually consistent.
   */
  async lockVisualDNA(params: {
    characterId: string;
    seed: number;
    basePrompt: string;
    imageUrl: string;
  }): Promise<void> {
    // Download and upload to R2 for permanent storage.
    const buffer = await this.fal.downloadImage(params.imageUrl);
    const upload = await this.storage.uploadImage(
      buffer,
      params.characterId,
      `profile-${Date.now()}.png`,
    );

    // Upsert profile media.
    await this.prisma.characterMedia.deleteMany({
      where: { characterId: params.characterId, type: 'profile' },
    });
    await this.prisma.characterMedia.create({
      data: {
        characterId: params.characterId,
        type: 'profile',
        url: upload.url,
        metadata: { seed: params.seed, basePrompt: params.basePrompt },
        order: 0,
      },
    });

    // Store Visual DNA on the Character row.
    await this.prisma.character.update({
      where: { id: params.characterId },
      data: {
        metadata: {
          seed: params.seed,
          basePrompt: params.basePrompt,
        },
      } as any,
    });
  }

  /**
   * Step 4: Auto-generate gallery images by reusing the locked seed +
   * base prompt with varied scene descriptions. Each image is downloaded,
   * uploaded to R2, and stored as a CharacterMedia row.
   */
  async generateGallery(characterId: string): Promise<{ count: number }> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { metadata: true } as any,
    });
    const meta = (character as any)?.metadata;
    if (!meta?.seed || !meta?.basePrompt) {
      throw new BadRequestException('Visual DNA not locked yet — pick a profile image first.');
    }

    const results: string[] = [];
    // Generate in batches of 3 to avoid overwhelming FAL.
    for (let i = 0; i < GALLERY_SCENES.length; i += 3) {
      const batch = GALLERY_SCENES.slice(i, i + 3);
      const images = await Promise.all(
        batch.map(async (scene, j) => {
          const prompt = `${meta.basePrompt}, ${scene}`;
          const fal = await this.fal.generateImage({
            prompt,
            imageSize: 'portrait_4_3',
            seed: meta.seed,
            enableSafetyChecker: true,
          });

          const buffer = await this.fal.downloadImage(fal.url);
          const upload = await this.storage.uploadImage(
            buffer,
            characterId,
            `gallery-${i + j}-${Date.now()}.png`,
          );

          await this.prisma.characterMedia.create({
            data: {
              characterId,
              type: 'gallery',
              url: upload.url,
              metadata: { scene, seed: meta.seed },
              order: i + j + 1,
            },
          });
          return upload.url;
        }),
      );
      results.push(...images);
    }

    return { count: results.length };
  }

  /**
   * Full pipeline convenience: persona → create Character row → return id.
   * The admin wizard calls the individual steps (generate candidates, lock
   * DNA, gallery) separately so the admin can review at each stage.
   */
  async createFromPersona(persona: GeneratedPersona, createdBy: string): Promise<string> {
    const character = await this.prisma.character.create({
      data: {
        name: persona.name,
        displayName: persona.displayName,
        description: persona.description,
        backstory: persona.backstory,
        speechQuirks: persona.speechQuirks,
        signaturePhrases: persona.signaturePhrases,
        bannedPhrases: persona.bannedPhrases,
        warmth: Math.max(0, Math.min(100, persona.warmth)),
        playfulness: Math.max(0, Math.min(100, persona.playfulness)),
        isPublic: false, // Admin publishes manually after review.
        createdBy,
      } as any,
    });
    return character.id;
  }
}
