/**
 * Cache Manager for Emoji Data
 * 
 * Implements LRU cache with localStorage persistence
 */

import { EmojiData, EmojiPack } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class EmojiCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly maxMemorySize = 100;
  private cacheDuration: number;
  private storageKey = 'tmoji_cache';

  constructor(cacheDuration: number = 24 * 60 * 60 * 1000) {
    this.cacheDuration = cacheDuration;
    this.loadFromStorage();
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    // Check memory first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && this.isValid(memEntry)) {
      return memEntry.data;
    }

    // Check localStorage
    const stored = this.getFromStorage(key);
    if (stored) {
      // Promote to memory cache
      this.memoryCache.set(key, stored);
      this.enforceMemoryLimit();
      return stored.data;
    }

    return null;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    };

    this.memoryCache.set(key, entry);
    this.enforceMemoryLimit();
    this.saveToStorage(key, entry);
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < this.cacheDuration;
  }

  /**
   * Enforce memory cache size limit (LRU eviction)
   */
  private enforceMemoryLimit(): void {
    while (this.memoryCache.size > this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean expired entries
        const now = Date.now();
        Object.keys(parsed).forEach(key => {
          if (now - parsed[key].timestamp > this.cacheDuration) {
            delete parsed[key];
          }
        });
      }
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Get from localStorage
   */
  private getFromStorage(key: string): CacheEntry<any> | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed[key] || null;
      }
    } catch (e) {
      // localStorage not available
    }
    return null;
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const cache = stored ? JSON.parse(stored) : {};
      cache[key] = entry;
      localStorage.setItem(this.storageKey, JSON.stringify(cache));
    } catch (e) {
      // localStorage not available or full
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Get cache key for emoji
   */
  static emojiKey(id: string): string {
    return `emoji:${id}`;
  }

  /**
   * Get cache key for pack
   */
  static packKey(name: string): string {
    return `pack:${name}`;
  }
}
