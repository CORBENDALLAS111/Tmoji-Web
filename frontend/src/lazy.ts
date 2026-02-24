/**
 * Lazy Loading Manager
 * 
 * Implements Intersection Observer for lazy emoji loading
 */

import { EmojiData, RenderOptions } from './types';
import { EmojiRenderer } from './renderer';

interface LazyEmojiEntry {
  container: HTMLElement;
  emoji: EmojiData;
  options: RenderOptions;
  loaded: boolean;
}

export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private entries: Map<HTMLElement, LazyEmojiEntry> = new Map();
  private rootMargin: string;

  constructor(rootMargin: string = '50px') {
    this.rootMargin = rootMargin;
    this.initObserver();
  }

  /**
   * Initialize Intersection Observer
   */
  private initObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback: load all immediately
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null,
        rootMargin: this.rootMargin,
        threshold: 0.1
      }
    );
  }

  /**
   * Handle intersection changes
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lazyEntry = this.entries.get(entry.target as HTMLElement);
        if (lazyEntry && !lazyEntry.loaded) {
          this.loadEmoji(lazyEntry);
        }
      }
    });
  }

  /**
   * Load emoji immediately
   */
  private async loadEmoji(entry: LazyEmojiEntry): Promise<void> {
    entry.loaded = true;

    // Show placeholder while loading
    entry.container.style.background = 'rgba(0,0,0,0.05)';
    entry.container.style.borderRadius = '50%';

    await EmojiRenderer.render(entry.container, entry.emoji, {
      ...entry.options,
      onLoad: () => {
        entry.container.style.background = '';
        entry.container.style.borderRadius = '';
        entry.options.onLoad?.();
      },
      onError: (err) => {
        entry.container.style.background = '';
        entry.options.onError?.(err);
      }
    });

    // Stop observing once loaded
    this.observer?.unobserve(entry.container);
  }

  /**
   * Add emoji to lazy loading queue
   */
  observe(
    container: HTMLElement,
    emoji: EmojiData,
    options: RenderOptions = {}
  ): void {
    const entry: LazyEmojiEntry = {
      container,
      emoji,
      options,
      loaded: false
    };

    this.entries.set(container, entry);
    this.observer?.observe(container);
  }

  /**
   * Force load all pending emojis
   */
  loadAll(): void {
    this.entries.forEach(entry => {
      if (!entry.loaded) {
        this.loadEmoji(entry);
      }
    });
  }

  /**
   * Disconnect observer and cleanup
   */
  destroy(): void {
    this.observer?.disconnect();
    this.entries.clear();
  }
}
