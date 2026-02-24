/**
 * Main Emoji Renderer
 * 
 * Handles rendering of all emoji formats: PNG, TGS (Lottie), WEBM, GIF
 */

import { EmojiData, RenderOptions } from './types';
import { TGSParser } from './parser';
import { LottieRenderer } from './lottie';

export class EmojiRenderer {
  /**
   * Render emoji to container
   */
  static async render(
    container: HTMLElement,
    emoji: EmojiData,
    options: RenderOptions = {}
  ): Promise<void> {
    // Apply custom class and styles
    if (options.className) {
      container.className = `tmoji ${options.className}`;
    } else {
      container.className = 'tmoji';
    }

    // Apply inline styles
    Object.assign(container.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      verticalAlign: 'middle',
      width: options.size || '1.2em',
      height: options.size || '1.2em',
      ...options.style
    });

    // Render based on file type
    if (emoji.file_type === 'tgs' || emoji.file_type === 'lottie') {
      await EmojiRenderer.renderTGS(container, emoji, options);
    } else if (emoji.file_type === 'webm' || emoji.file_type === 'video') {
      await EmojiRenderer.renderWEBM(container, emoji, options);
    } else if (emoji.file_type === 'gif') {
      await EmojiRenderer.renderGIF(container, emoji, options);
    } else {
      await EmojiRenderer.renderPNG(container, emoji, options);
    }
  }

  /**
   * Render TGS/Lottie animation
   */
  private static async renderTGS(
    container: HTMLElement,
    emoji: EmojiData,
    options: RenderOptions
  ): Promise<void> {
    try {
      // Fetch TGS data
      const response = await fetch(emoji.file_url);
      if (!response.ok) throw new Error('Failed to fetch TGS');

      const arrayBuffer = await response.arrayBuffer();
      const animationData = await TGSParser.decompressTGS(arrayBuffer);

      // Render with Lottie
      const renderer = new LottieRenderer(container, animationData, options);
      await renderer.render();

      // Store reference for cleanup
      (container as any).__lottieRenderer = renderer;

    } catch (error) {
      console.error('TGS render failed:', error);
      // Fallback to thumbnail or PNG
      if (emoji.thumbnail_url) {
        await EmojiRenderer.renderPNG(container, { ...emoji, file_url: emoji.thumbnail_url }, options);
      }
      options.onError?.(error as Error);
    }
  }

  /**
   * Render WEBM video
   */
  private static async renderWEBM(
    container: HTMLElement,
    emoji: EmojiData,
    options: RenderOptions
  ): Promise<void> {
    const video = document.createElement('video');
    video.src = emoji.file_url;
    video.autoplay = options.animated !== false;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    Object.assign(video.style, {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    });

    video.onloadeddata = () => options.onLoad?.();
    video.onerror = () => options.onError?.(new Error('Failed to load WEBM'));

    container.appendChild(video);
  }

  /**
   * Render GIF
   */
  private static async renderGIF(
    container: HTMLElement,
    emoji: EmojiData,
    options: RenderOptions
  ): Promise<void> {
    const img = document.createElement('img');
    img.src = emoji.file_url;
    img.alt = options.alt || emoji.short_name || 'emoji';

    Object.assign(img.style, {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    });

    img.onload = () => options.onLoad?.();
    img.onerror = () => options.onError?.(new Error('Failed to load GIF'));

    container.appendChild(img);
  }

  /**
   * Render static PNG
   */
  private static async renderPNG(
    container: HTMLElement,
    emoji: EmojiData,
    options: RenderOptions
  ): Promise<void> {
    const img = document.createElement('img');
    img.src = emoji.file_url;
    img.alt = options.alt || emoji.short_name || 'emoji';

    Object.assign(img.style, {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    });

    img.onload = () => options.onLoad?.();
    img.onerror = () => {
      // Show fallback
      container.textContent = options.alt || '□';
      options.onError?.(new Error('Failed to load PNG'));
    };

    container.appendChild(img);
  }

  /**
   * Clean up emoji instance
   */
  static cleanup(container: HTMLElement): void {
    const renderer = (container as any).__lottieRenderer;
    if (renderer) {
      renderer.destroy();
      delete (container as any).__lottieRenderer;
    }
    container.innerHTML = '';
  }
}
