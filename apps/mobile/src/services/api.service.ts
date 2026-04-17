import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ?? (__DEV__ ? 'http://localhost:3001/api' : 'https://api.ethereal.app/api');

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed && error.config) {
            return this.client.request(error.config);
          }
          // Clear auth and redirect to login
          await this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // AUTH
  // ============================================

  async register(data: {
    email: string;
    password: string;
    username?: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    await this.saveTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    await this.saveTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      await this.clearAuth();
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await this.client.post('/auth/refresh', { refreshToken });
      await this.saveTokens(response.data.accessToken, response.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // ============================================
  // USERS
  // ============================================

  async getProfile() {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  }) {
    const response = await this.client.patch('/users/profile', data);
    return response.data;
  }

  async getCredits() {
    const response = await this.client.get('/users/credits');
    return response.data;
  }

  async getTransactions(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get('/users/transactions', { params });
    return response.data;
  }

  async updatePushToken(pushToken: string) {
    const response = await this.client.patch('/users/push-token', { pushToken });
    return response.data;
  }

  async claimDailyReward() {
    const response = await this.client.post('/credits/claim-daily');
    return response.data;
  }

  async claimProfileBonuses() {
    const response = await this.client.post('/credits/claim-profile-bonuses');
    return response.data;
  }

  // ============================================
  // CHARACTERS
  // ============================================

  async getCharacters(params?: {
    category?: string;
    search?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/characters', { params });
    return response.data;
  }

  async matchCharacters(warmth: number, playfulness: number) {
    const response = await this.client.post('/characters/match', { warmth, playfulness });
    return response.data;
  }

  async getCharacter(id: string) {
    const response = await this.client.get(`/characters/${id}`);
    return response.data;
  }

  async createCharacter(data: any) {
    const response = await this.client.post('/characters', data);
    return response.data;
  }

  async updateCharacter(id: string, data: any) {
    const response = await this.client.patch(`/characters/${id}`, data);
    return response.data;
  }

  async deleteCharacter(id: string) {
    await this.client.delete(`/characters/${id}`);
  }

  // ============================================
  // CONVERSATIONS
  // ============================================

  async getConversations(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get('/conversations', { params });
    return response.data;
  }

  async getConversation(id: string) {
    const response = await this.client.get(`/conversations/${id}`);
    return response.data;
  }

  async createConversation(data: { characterId: string }) {
    const response = await this.client.post('/conversations', data);
    return response.data;
  }

  async deleteConversation(id: string) {
    await this.client.delete(`/conversations/${id}`);
  }

  // ============================================
  // MEDIA
  // ============================================

  async generateImage(data: {
    prompt: string;
    characterId?: string;
    imageSize?: 'square' | 'portrait' | 'landscape';
  }) {
    const response = await this.client.post('/media/generate/image', data);
    return response.data;
  }

  async generateVoice(data: {
    text: string;
    characterId?: string;
    language?: 'en' | 'az';
  }) {
    const response = await this.client.post('/media/generate/voice', data);
    return response.data;
  }

  async getVoices() {
    const response = await this.client.get('/media/voices');
    return response.data;
  }

  async getGenerationJob(jobId: string) {
    const response = await this.client.get(`/media/generate/jobs/${jobId}`);
    return response.data;
  }

  async getGenerationHistory(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get('/media/generate/history', { params });
    return response.data;
  }

  // ============================================
  // HELPERS
  // ============================================

  private async saveTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
  }

  private async clearAuth() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  }
}

export const apiService = new ApiService();
