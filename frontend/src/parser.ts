/**
 * TGS File Parser
 * 
 * TGS files are gzip-compressed Lottie JSON animations.
 * This module handles decompression and parsing.
 */

export class TGSParser {
  /**
   * Decompress TGS data to Lottie JSON
   * TGS = gzip(Lottie JSON)
   */
  static async decompressTGS(tgsData: ArrayBuffer | Uint8Array): Promise<object> {
    // Check if we're in a browser environment with CompressionStream
    if (typeof window !== 'undefined' && 'DecompressionStream' in window) {
      return await TGSParser.decompressWithStream(tgsData);
    }

    // Fallback for Node.js or older browsers
    return await TGSParser.decompressWithPako(tgsData);
  }

  /**
   * Decompress using Web Streams API
   */
  private static async decompressWithStream(data: ArrayBuffer | Uint8Array): Promise<object> {
    const stream = new Response(data).body;
    if (!stream) throw new Error('Failed to create stream');

    const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
    const response = new Response(decompressed);
    const text = await response.text();

    return JSON.parse(text);
  }

  /**
   * Decompress using pako (fallback)
   * In production, include pako library for broader compatibility
   */
  private static async decompressWithPako(data: ArrayBuffer | Uint8Array): Promise<object> {
    // Dynamic import pako if available
    try {
      const pako = await import('pako');
      const inflated = pako.inflate(new Uint8Array(data));
      const text = new TextDecoder().decode(inflated);
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to decompress TGS. Pako library required for this environment.');
    }
  }

  /**
   * Fetch and decompress TGS from URL
   */
  static async fetchAndDecompress(url: string): Promise<object> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch TGS: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return await TGSParser.decompressTGS(arrayBuffer);
  }

  /**
   * Check if data is valid TGS (gzip compressed)
   */
  static isTGS(data: Uint8Array): boolean {
    // Gzip magic number: 0x1f 0x8b
    return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
  }

  /**
   * Convert TGS to Lottie JSON string
   */
  static async toLottieJSON(tgsData: ArrayBuffer | Uint8Array): Promise<string> {
    const obj = await TGSParser.decompressTGS(tgsData);
    return JSON.stringify(obj);
  }
}
