import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LinkGuestDto } from './dto/link-guest.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  AUTH_COOKIE_NAME,
  GUEST_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  clearGuestCookie,
  setAuthCookies,
  setGuestCookie,
} from './auth.cookies';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    // Leave the guest cookie in place here — the web app calls /auth/link-guest
    // once it has the new user id; that endpoint clears the cookie on success.
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    // A returning user shouldn't carry a stale guest session; clear it.
    clearGuestCookie(res);
    return result;
  }

  /**
   * Accept refresh token from HttpOnly cookie first, body second (mobile).
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body('refreshToken') bodyToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const refreshToken = cookieToken || bodyToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const tokens = await this.authService.refreshToken(refreshToken);
    setAuthCookies(res, tokens);
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken =
      req.cookies?.[AUTH_COOKIE_NAME] ||
      (req.headers.authorization?.split(' ')[1] ?? '');
    const user = (req as any).user;
    await this.authService.logout(user.id, accessToken);
    clearAuthCookies(res);
    clearGuestCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    return (req as any).user;
  }

  /**
   * Create (or re-use) a guest session so the unauthenticated landing page
   * preview can use the real chat pipeline. Idempotent on the guest cookie:
   * if a valid guest already exists, we return it instead of spawning another.
   */
  @Post('guest')
  @HttpCode(HttpStatus.OK)
  async createGuest(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const existingGuestId = req.cookies?.[GUEST_COOKIE_NAME];
    if (existingGuestId) {
      // If this guest is still valid, don't burn a DB row on every visit.
      // (Minimal validation here — the chat service does the expiry check.)
      return { guestId: existingGuestId, reused: true };
    }

    const guest = await this.authService.createGuest();
    setGuestCookie(res, guest.guestId);
    return { guestId: guest.guestId, credits: guest.credits, reused: false };
  }

  /**
   * Called from the register flow to re-own any conversations the user
   * started as a guest. Requires a valid auth cookie (the new account) and
   * reads the guest id from the cookie (or body as fallback).
   */
  @Post('link-guest')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async linkGuest(
    @Req() req: Request,
    @Body() dto: LinkGuestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = (req as any).user;
    const guestId = dto.guestId || req.cookies?.[GUEST_COOKIE_NAME];
    if (!guestId) {
      return { linkedConversations: 0, skipped: 'no-guest-cookie' };
    }
    const result = await this.authService.linkGuestToUser(guestId, user.id);
    clearGuestCookie(res);
    return result;
  }
}
