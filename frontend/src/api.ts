/**
 * API Client for Backend Communication
 * 
 * Handles all HTTP requests to the emoji backend service
 */

import { EmojiData, EmojiPack } from './types';

export class EmojiAPI {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Fetch emoji by ID
   */
  async getEmoji(id: string): Promise<EmojiData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/emoji/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch emoji:', error);
      return null;
    }
  }

  /**
   * Fetch emoji pack by URL or name
   */
  async getPack(urlOrName: string): Promise<EmojiPack | null> {
    try {
      const encoded = encodeURIComponent(urlOrName);
      const response = await fetch(`${this.baseUrl}/pack?url=${encoded}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch pack:', error);
      return null;
    }
  }

  /**
   * Fetch manifest for a pack
   */
  async getManifest(packId: string): Promise<EmojiPack | null> {
    try {
      const response = await fetch(`${this.baseUrl}/manifest/${packId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch manifest:', error);
      return null;
    }
  }

  /**
   * Fetch multiple emojis by IDs
   */
  async getEmojis(ids: string[]): Promise<EmojiData[]> {
    const results = await Promise.all(
      ids.map(id => this.getEmoji(id))
    );
    return results.filter((e): e is EmojiData => e !== null);
  }

  /**
   * Set base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }
}
