import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Guest sessions get a small pot of credits so the existing credit-deduction
// flow in chat.service can stay untouched (1 credit per message × 5 = 5).
const GUEST_CREDITS = 5;
const GUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.username ? [{ username: dto.username }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        credits: 100, // Initial credits
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        credits: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      console.log(`[Auth] Login failed: no user found for ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[Auth] User found: ${user.email}, hash starts with: ${user.passwordHash.substring(0, 10)}...`);

    // Verify password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      console.log(`[Auth] bcrypt.compare result: ${isPasswordValid}`);
    } catch (err) {
      console.error(`[Auth] bcrypt.compare threw an error:`, err);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!isPasswordValid) {
      console.log(`[Auth] Login failed: password mismatch for ${user.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    console.log(`[Auth] Generating tokens for ${user.email}...`);
    const tokens = await this.generateTokens(user.id, user.email);
    console.log(`[Auth] Tokens generated successfully`);

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);
    console.log(`[Auth] Session created. Login complete for ${user.email}, role: ${(user as any).role}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        credits: user.credits,
        isPremium: user.isPremium,
        language: user.language,
        role: (user as any).role ?? 'USER',
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Find session
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.userId !== payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session expired
      if (session.expiresAt < new Date()) {
        await this.prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedException('Session expired');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(session.userId, session.user.email);

      // Update session
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, accessToken: string) {
    // Delete session
    await this.prisma.session.deleteMany({
      where: {
        userId,
        accessToken,
      },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Create an anonymous guest user so the landing "Try her" preview can use
   * the same chat pipeline as a logged-in user. Guest users have a synthetic
   * email, a random unusable passwordHash, and a small credit budget that
   * naturally caps the preview at GUEST_CREDITS messages.
   */
  async createGuest() {
    const guestId = randomUUID();
    const user = await this.prisma.user.create({
      data: {
        email: `guest-${guestId}@ethereal.local`,
        passwordHash: `!guest-${randomUUID()}`,
        credits: GUEST_CREDITS,
        // Using `as any` so this compiles before `prisma generate` is re-run
        // against the new schema fields — runtime accepts them because the
        // migration has landed.
        ...({
          isGuest: true,
          guestExpiresAt: new Date(Date.now() + GUEST_TTL_MS),
        } as any),
      },
      select: {
        id: true,
        email: true,
        credits: true,
        createdAt: true,
      },
    });

    return { guestId: user.id, credits: user.credits };
  }

  /**
   * Called right after a guest registers: re-owns every conversation and
   * message from the guest user onto the real user, then disables the guest.
   * All operations run in a transaction so we never end up with orphan rows.
   */
  async linkGuestToUser(guestUserId: string, realUserId: string) {
    if (guestUserId === realUserId) return { linkedConversations: 0 };

    const guest = await this.prisma.user.findUnique({
      where: { id: guestUserId },
      select: { id: true, isGuest: true } as any,
    });

    if (!guest) {
      // Nothing to link — either the guest expired or the cookie was forged.
      return { linkedConversations: 0 };
    }

    if (!(guest as any).isGuest) {
      throw new BadRequestException('Referenced user is not a guest session');
    }

    return this.prisma.$transaction(async (tx) => {
      const { count: linkedConversations } = await tx.conversation.updateMany({
        where: { userId: guestUserId },
        data: {
          userId: realUserId,
          // Using `as any` until `prisma generate` picks up the new field.
          ...({ isTemporary: false } as any),
        },
      });

      await tx.message.updateMany({
        where: { userId: guestUserId },
        data: { userId: realUserId },
      });

      // Soft-disable the guest shell rather than deleting, so historical
      // Session/Transaction rows (FK) stay intact for audit.
      await tx.user.update({
        where: { id: guestUserId },
        data: {
          isActive: false,
          ...({ guestExpiresAt: new Date() } as any),
        },
      });

      return { linkedConversations };
    });
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        language: true,
        credits: true,
        isPremium: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    return { accessToken, refreshToken };
  }

  async createSession(userId: string, accessToken: string, refreshToken: string) {
    // Delete old sessions for this user (optional: limit to N sessions)
    const sessionCount = await this.prisma.session.count({
      where: { userId },
    });

    if (sessionCount >= 5) {
      // Keep only the 4 most recent sessions
      const oldSessions = await this.prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: sessionCount - 4,
      });

      await this.prisma.session.deleteMany({
        where: {
          id: {
            in: oldSessions.map((s) => s.id),
          },
        },
      });
    }

    // Create new session
    await this.prisma.session.create({
      data: {
        userId,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }
}
