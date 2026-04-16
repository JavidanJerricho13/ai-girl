import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { AUTH_COOKIE_NAME } from '../auth/auth.cookies';

/**
 * Socket.IO handshake auth. Accepts a JWT from two places so both transports
 * we care about keep working:
 *   - `auth.token` (Bearer) — used by the React Native mobile client via
 *     AsyncStorage (see apps/mobile/src/services/websocket.service.ts)
 *   - cookie `auth-token` — used by the web client (HttpOnly, set by
 *     /api/auth/login)
 *
 * On success, `userId` is stashed on `socket.data.userId` and the socket is
 * auto-joined to `user:${userId}` so services can push per-user events
 * (proactive messages, credit updates, etc.) without carrying sockets around.
 *
 * We deliberately DO NOT reject unauthenticated sockets here — the legacy
 * gateway contract accepted anonymous connections that passed `userId` in
 * the message body, and rejecting would break the mobile app mid-flight.
 * Instead, `socket.data.userId` stays undefined, the gateway falls back to
 * body.userId, and per-user broadcasts just skip that socket.
 */

const logger = new Logger('WsAuth');

interface JwtPayload {
  sub?: string;
  email?: string;
}

function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((c) => c.trim());
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

function extractToken(socket: Socket): string | null {
  const handshake = socket.handshake;
  const fromAuth =
    typeof handshake.auth?.token === 'string' ? handshake.auth.token : null;
  if (fromAuth) return fromAuth;
  return readCookie(handshake.headers.cookie, AUTH_COOKIE_NAME);
}

export function createWsAuthMiddleware(
  jwtService: JwtService,
  configService: ConfigService,
) {
  return (socket: Socket, next: (err?: any) => void) => {
    const token = extractToken(socket);
    if (!token) {
      // Legacy/unauthed socket — allow through; gateway handles fallback.
      return next();
    }

    try {
      const payload = jwtService.verify<JwtPayload>(token, {
        secret: configService.get('JWT_SECRET'),
      });
      if (payload?.sub) {
        socket.data.userId = payload.sub;
        socket.join(`user:${payload.sub}`);
      }
    } catch (err) {
      // Stale/forged tokens: ignore silently. Socket still connects as
      // anonymous — matches legacy behaviour.
      logger.debug(`Ignoring invalid socket token: ${(err as Error).message}`);
    }
    next();
  };
}
