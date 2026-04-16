import { Injectable, Logger } from '@nestjs/common';

/**
 * Mock implementation of push notifications. Real delivery (Expo / APNs /
 * FCM) plugs in here once the mobile DeviceToken table lands.
 *
 * Interface is deliberately small so the engagement service doesn't bake in
 * provider assumptions — we send "a short line of text to a user" and the
 * platform decides how to surface it.
 */
export interface ProactivePushPayload {
  userId: string;
  characterName: string;
  preview: string;
  conversationId: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async sendProactive(payload: ProactivePushPayload): Promise<void> {
    // TODO: look up DeviceToken rows for this user and fan out to Expo/APNs.
    this.logger.log(
      `[mock-push] user=${payload.userId} character="${payload.characterName}" preview="${payload.preview.slice(0, 60)}"`,
    );
  }
}
