/**
 * TMoji Web Library - Main Class
 * 
 * Primary interface for using Telegram Premium Custom Emojis on websites
 */

import { TMojiConfig, EmojiData, EmojiPack, RenderOptions, ParsedEmoji } from './types';
import { EmojiCache } from './cache';
import { EmojiAPI } from './api';
import { EmojiRenderer } from './renderer';
import { LazyLoader } from './lazy';
import { TextParser } from './text-parser';

export class TMoji {
  private config: TMojiConfig;
  private cache: EmojiCache;
  private api: EmojiAPI;
  private lazyLoader: LazyLoader;
  private loadedPacks: Map<string, EmojiPack> = new Map();
  private nameToIdMap: Map<string, string> = new Map();

  // Default configuration
  static defaults: TMojiConfig = {
    apiBaseUrl: 'http://localhost:8000',
    defaultSize: '1.2em',
    animated: true,
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
    lazyThreshold: '50px',
    fallbackEmoji: '□'
  };

  constructor(config: Partial<TMojiConfig> = {}) {
    this.config = { ...TMoji.defaults, ...config };
    this.cache = new EmojiCache(this.config.cacheDuration);
    this.api = new EmojiAPI(this.config.apiBaseUrl);
    this.lazyLoader = new LazyLoader(this.config.lazyThreshold);
  }

  /**
   * Configure the library
   */
  configure(config: Partial<TMojiConfig>): void {
    this.config = { ...this.config, ...config };
    this.api.setBaseUrl(this.config.apiBaseUrl);
  }

  /**
   * Load emoji pack from Telegram link or name
   */
  async loadPack(urlOrName: string): Promise<EmojiPack | null> {
    // Check cache first
    const cacheKey = EmojiCache.packKey(urlOrName);
    const cached = this.cache.get<EmojiPack>(cacheKey);
    if (cached) {
      this.loadedPacks.set(cached.name, cached);
      this.updateNameMap(cached);
      return cached;
    }

    // Fetch from API
    const pack = await this.api.getPack(urlOrName);
    if (pack) {
      this.cache.set(cacheKey, pack);
      this.loadedPacks.set(pack.name, pack);
      this.updateNameMap(pack);
    }

    return pack;
  }

  /**
   * Get emoji by ID
   */
  async getEmoji(id: string): Promise<EmojiData | null> {
    // Check cache
    const cacheKey = EmojiCache.emojiKey(id);
    const cached = this.cache.get<EmojiData>(cacheKey);
    if (cached) return cached;

    // Fetch from API
    const emoji = await this.api.getEmoji(id);
    if (emoji) {
      this.cache.set(cacheKey, emoji);
    }

    return emoji;
  }

  /**
   * Render emoji to container element
   */
  async renderTo(
    container: HTMLElement | string,
    emojiId: string,
    options: RenderOptions = {}
  ): Promise<void> {
    const element = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container;

    if (!element) {
      throw new Error(`Container not found: ${container}`);
    }

    const emoji = await this.getEmoji(emojiId);
    if (!emoji) {
      element.textContent = this.config.fallbackEmoji;
      throw new Error(`Emoji not found: ${emojiId}`);
    }

    await EmojiRenderer.render(element, emoji, {
      size: this.config.defaultSize,
      animated: this.config.animated,
      ...options
    });
  }

  /**
   * Render emoji with lazy loading
   */
  async lazyRender(
    container: HTMLElement | string,
    emojiId: string,
    options: RenderOptions = {}
  ): Promise<void> {
    const element = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container;

    if (!element) {
      throw new Error(`Container not found: ${container}`);
    }

    const emoji = await this.getEmoji(emojiId);
    if (!emoji) {
      element.textContent = this.config.fallbackEmoji;
      return;
    }

    this.lazyLoader.observe(element, emoji, {
      size: this.config.defaultSize,
      animated: this.config.animated,
      ...options
    });
  }

  /**
   * Render text with {emoji:ID} syntax
   */
  async renderText(
    container: HTMLElement | string,
    text: string,
    options: RenderOptions = {}
  ): Promise<void> {
    const element = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container;

    if (!element) {
      throw new Error(`Container not found: ${container}`);
    }

    const parsed = TextParser.parse(text);
    element.innerHTML = '';

    for (const part of parsed) {
      if (part.type === 'text') {
        element.appendChild(document.createTextNode(part.content));
      } else if (part.type === 'emoji' && part.emojiId) {
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'tmoji-inline';
        element.appendChild(emojiSpan);

        // Render emoji (not lazy for inline)
        await this.renderTo(emojiSpan, part.emojiId, options);
      }
    }
  }

  /**
   * Parse and render all <tmoji> tags in document
   */
  async parseAll(options: RenderOptions = {}): Promise<void> {
    const elements = document.querySelectorAll('tmoji');

    const promises = Array.from(elements).map(async (el) => {
      const emojiId = el.getAttribute('id') || el.getAttribute('emoji-id');
      if (!emojiId) return;

      const size = el.getAttribute('size') || this.config.defaultSize;
      const animated = el.getAttribute('animated') !== 'false';

      // Create wrapper
      const wrapper = document.createElement('span');
      wrapper.className = 'tmoji-wrapper';

      // Replace element
      el.parentNode?.insertBefore(wrapper, el);
      el.remove();

      await this.lazyRender(wrapper, emojiId, {
        size,
        animated,
        ...options
      });
    });

    await Promise.all(promises);
  }

  /**
   * Get emoji by short name (requires pack to be loaded)
   */
  getByName(name: string): EmojiData | null {
    const emojiId = this.nameToIdMap.get(name);
    if (!emojiId) return null;

    // Find in loaded packs
    for (const pack of this.loadedPacks.values()) {
      const emoji = pack.stickers.find(e => e.id === emojiId);
      if (emoji) return emoji;
    }

    return null;
  }

  /**
   * Get all loaded packs
   */
  getLoadedPacks(): EmojiPack[] {
    return Array.from(this.loadedPacks.values());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update name to ID mapping from pack
   */
  private updateNameMap(pack: EmojiPack): void {
    pack.stickers.forEach(emoji => {
      if (emoji.short_name) {
        this.nameToIdMap.set(emoji.short_name, emoji.id);
      }
    });
  }

  /**
   * Static render method (for simple usage)
   */
  static async render(
    container: HTMLElement | string,
    emojiId: string,
    options: RenderOptions & { apiBaseUrl?: string } = {}
  ): Promise<void> {
    const instance = new TMoji({
      apiBaseUrl: options.apiBaseUrl || TMoji.defaults.apiBaseUrl
    });
    await instance.renderTo(container, emojiId, options);
  }

  /**
   * Static parseAll method
   */
  static async parseAll(options?: RenderOptions & { apiBaseUrl?: string }): Promise<void> {
    const instance = new TMoji({
      apiBaseUrl: options?.apiBaseUrl || TMoji.defaults.apiBaseUrl
    });
    await instance.parseAll(options);
  }
}

// Export types
export * from './types';
export { EmojiCache } from './cache';
export { EmojiAPI } from './api';
export { EmojiRenderer } from './renderer';
export { LazyLoader } from './lazy';
export { TextParser } from './text-parser';
export { TGSParser } from './parser';
export { LottieRenderer } from './lottie';
