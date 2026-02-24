/**
 * Telegram Emoji Web Library - Type Definitions
 * 
 * Type definitions for the tmoji-web library
 */

export interface TMojiConfig {
  /** Backend API base URL */
  apiBaseUrl: string;
  /** Default emoji size */
  defaultSize: string;
  /** Enable animations by default */
  animated: boolean;
  /** CDN URL for static assets */
  cdnUrl?: string;
  /** Cache duration in milliseconds */
  cacheDuration: number;
  /** Lazy loading threshold */
  lazyThreshold: string;
  /** Fallback emoji when loading fails */
  fallbackEmoji: string;
}

export interface EmojiData {
  /** Unique custom emoji ID */
  id: string;
  /** Short name/identifier */
  short_name: string;
  /** Associated unicode emoji */
  emoji?: string;
  /** File type: 'png' | 'tgs' | 'webm' | 'gif' */
  file_type: string;
  /** URL to the emoji file */
  file_url: string;
  /** URL to thumbnail (static preview) */
  thumbnail_url?: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Whether emoji is animated */
  is_animated: boolean;
  /** Whether emoji is video format */
  is_video: boolean;
  /** Pack name this emoji belongs to */
  set_name?: string;
  /** Whether emoji needs repainting */
  needs_repainting?: boolean;
}

export interface EmojiPack {
  /** Pack name (unique identifier) */
  name: string;
  /** Display title */
  title: string;
  /** Type: 'regular' | 'mask' | 'custom_emoji' */
  sticker_type: string;
  /** List of emojis in pack */
  stickers: EmojiData[];
  /** Thumbnail URL */
  thumbnail?: string;
}

export interface RenderOptions {
  /** Emoji size (CSS value) */
  size?: string;
  /** Enable animation */
  animated?: boolean;
  /** CSS class names */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
  /** Callback when emoji loads */
  onLoad?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Alt text for accessibility */
  alt?: string;
}

export type EmojiFormat = 'png' | 'tgs' | 'webm' | 'gif' | 'lottie';

export interface ParsedEmoji {
  type: 'text' | 'emoji';
  content: string;
  emojiId?: string;
}
