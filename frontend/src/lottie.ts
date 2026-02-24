/**
 * Lottie Animation Renderer
 * 
 * Handles rendering of Lottie animations using lottie-web
 */

import { RenderOptions } from './types';

interface LottieInstance {
  play: () => void;
  pause: () => void;
  stop: () => void;
  destroy: () => void;
  goToAndStop: (frame: number, isFrame?: boolean) => void;
  resize: () => void;
}

export class LottieRenderer {
  private container: HTMLElement;
  private animationData: object;
  private options: RenderOptions;
  private instance: LottieInstance | null = null;
  private isLoaded = false;

  constructor(
    container: HTMLElement,
    animationData: object,
    options: RenderOptions = {}
  ) {
    this.container = container;
    this.animationData = animationData;
    this.options = options;
  }

  /**
   * Load and render the Lottie animation
   */
  async render(): Promise<void> {
    try {
      // Dynamic import lottie-web
      const lottieModule = await import('lottie-web');
      const lottie = lottieModule.default || lottieModule;

      // Clear container
      this.container.innerHTML = '';
      this.container.style.display = 'inline-block';
      this.container.style.width = this.options.size || '1.2em';
      this.container.style.height = this.options.size || '1.2em';

      // Create animation
      this.instance = lottie.loadAnimation({
        container: this.container,
        renderer: 'svg',
        loop: true,
        autoplay: this.options.animated !== false,
        animationData: this.animationData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          clearCanvas: true,
          progressiveLoad: true,
        }
      }) as LottieInstance;

      // Handle load event
      if (this.options.onLoad) {
        // lottie-web uses 'DOMLoaded' event
        (this.instance as any).addEventListener('DOMLoaded', () => {
          this.isLoaded = true;
          this.options.onLoad?.();
        });
      }

      // Handle errors
      if (this.options.onError) {
        (this.instance as any).addEventListener('data_failed', () => {
          this.options.onError?.(new Error('Failed to load animation data'));
        });
      }

    } catch (error) {
      console.error('Failed to render Lottie:', error);
      this.options.onError?.(error as Error);
    }
  }

  /**
   * Play animation
   */
  play(): void {
    this.instance?.play();
  }

  /**
   * Pause animation
   */
  pause(): void {
    this.instance?.pause();
  }

  /**
   * Stop animation
   */
  stop(): void {
    this.instance?.stop();
  }

  /**
   * Destroy animation instance
   */
  destroy(): void {
    this.instance?.destroy();
    this.instance = null;
  }

  /**
   * Resize animation
   */
  resize(): void {
    this.instance?.resize();
  }
}
