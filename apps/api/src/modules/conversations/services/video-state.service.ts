import { Injectable, Logger } from '@nestjs/common';

export enum VideoCallState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  SPEAKING = 'speaking',
}

export interface VideoStateData {
  state: VideoCallState;
  videoUrl?: string;
  duration?: number;
  timestamp: number;
}

@Injectable()
export class VideoStateService {
  private readonly logger = new Logger(VideoStateService.name);
  private activeStates = new Map<string, VideoCallState>();

  /**
   * Get current state for a conversation
   */
  getState(conversationId: string): VideoCallState {
    return this.activeStates.get(conversationId) || VideoCallState.IDLE;
  }

  /**
   * Set state for a conversation
   */
  setState(conversationId: string, state: VideoCallState): void {
    this.activeStates.set(conversationId, state);
    this.logger.log(`Video state changed for ${conversationId}: ${state}`);
  }

  /**
   * Transition to LISTENING state (user starts speaking)
   */
  startListening(conversationId: string): VideoStateData {
    this.setState(conversationId, VideoCallState.LISTENING);
    return {
      state: VideoCallState.LISTENING,
      timestamp: Date.now(),
    };
  }

  /**
   * Transition to PROCESSING state (AI is thinking)
   */
  startProcessing(conversationId: string): VideoStateData {
    this.setState(conversationId, VideoCallState.PROCESSING);
    return {
      state: VideoCallState.PROCESSING,
      timestamp: Date.now(),
    };
  }

  /**
   * Transition to SPEAKING state (AI is responding)
   * @param audioUrl URL of the generated audio
   * @param duration Duration of audio in milliseconds
   */
  startSpeaking(
    conversationId: string,
    audioUrl: string,
    duration: number,
  ): VideoStateData {
    this.setState(conversationId, VideoCallState.SPEAKING);
    
    // Auto-transition back to IDLE after speaking
    setTimeout(() => {
      this.returnToIdle(conversationId);
    }, duration);

    return {
      state: VideoCallState.SPEAKING,
      videoUrl: audioUrl, // In practice, this would be a video URL
      duration,
      timestamp: Date.now(),
    };
  }

  /**
   * Return to IDLE state
   */
  returnToIdle(conversationId: string): VideoStateData {
    this.setState(conversationId, VideoCallState.IDLE);
    return {
      state: VideoCallState.IDLE,
      timestamp: Date.now(),
    };
  }

  /**
   * Clean up state when conversation ends
   */
  cleanup(conversationId: string): void {
    this.activeStates.delete(conversationId);
    this.logger.log(`Cleaned up video state for ${conversationId}`);
  }

  /**
   * Get all active video call sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.activeStates.keys());
  }
}
