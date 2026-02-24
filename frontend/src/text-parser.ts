/**
 * Text Parser for Emoji Syntax
 * 
 * Parses text with emoji placeholders like:
 * - {emoji:123456789}
 * - :emoji_name:
 * - <tmoji id="123">
 */

import { ParsedEmoji } from './types';

export class TextParser {
  /**
   * Parse text with {emoji:ID} syntax
   */
  static parse(text: string): ParsedEmoji[] {
    const results: ParsedEmoji[] = [];
    const regex = /\{emoji:(\d+)\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Text before emoji
      if (match.index > lastIndex) {
        results.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Emoji
      results.push({
        type: 'emoji',
        content: match[0],
        emojiId: match[1]
      });

      lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < text.length) {
      results.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return results;
  }

  /**
   * Parse HTML-style <tmoji> tags
   */
  static parseHTML(html: string): { text: string; emojis: Map<number, string> } {
    const emojis = new Map<number, string>();
    let text = html;
    let offset = 0;

    // Match <tmoji id="123"> or <tmoji emoji-id="123">
    const regex = /<tmoji\s+(?:emoji-)?id="(\d+)"[^>]*>.*?<\/tmoji>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const emojiId = match[1];
      const fullMatch = match[0];
      const index = match.index - offset;

      // Replace with placeholder character (□)
      text = text.replace(fullMatch, '□');
      emojis.set(index, emojiId);

      offset += fullMatch.length - 1;
    }

    return { text, emojis };
  }

  /**
   * Parse colon-style :emoji_name: syntax
   * Requires emoji name to ID mapping
   */
  static parseColonSyntax(
    text: string,
    nameToIdMap: Map<string, string>
  ): ParsedEmoji[] {
    const results: ParsedEmoji[] = [];
    const regex = /:([a-zA-Z0-9_]+):/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const name = match[1];
      const emojiId = nameToIdMap.get(name);

      // Text before
      if (match.index > lastIndex) {
        results.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      if (emojiId) {
        // Known emoji
        results.push({
          type: 'emoji',
          content: match[0],
          emojiId
        });
      } else {
        // Unknown, treat as text
        results.push({
          type: 'text',
          content: match[0]
        });
      }

      lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < text.length) {
      results.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return results;
  }
}
