import { TextChunk } from '../types';

export class ChunkingService {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(chunkSize: number = 3000, chunkOverlap: number = 300) {
    this.chunkSize = chunkSize; // ~750 tokens
    this.chunkOverlap = chunkOverlap; // ~75 tokens overlap
  }

  /**
   * Split text into semantic chunks using recursive character splitting
   * @param text - The text to chunk
   * @param filename - Original filename for metadata
   * @returns Array of text chunks with metadata
   */
  chunkText(text: string, filename: string): TextChunk[] {
    // Normalize whitespace
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    if (normalizedText.length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < normalizedText.length) {
      // Calculate end index for this chunk
      let endIndex = startIndex + this.chunkSize;

      // If this isn't the last chunk, try to find a good breaking point
      if (endIndex < normalizedText.length) {
        endIndex = this.findBreakPoint(normalizedText, startIndex, endIndex);
      } else {
        endIndex = normalizedText.length;
      }

      // Extract chunk text
      const chunkText = normalizedText.substring(startIndex, endIndex).trim();

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          metadata: {
            filename,
            chunkIndex,
          },
        });
        chunkIndex++;
      }

      // Move to next chunk with overlap
      startIndex = endIndex - this.chunkOverlap;

      // Ensure we always make progress
      if (startIndex <= chunks[chunks.length - 1]?.text.length) {
        startIndex = endIndex;
      }
    }

    return chunks;
  }

  /**
   * Find a good breaking point for a chunk (sentence or paragraph boundary)
   * @param text - Full text
   * @param start - Start index
   * @param idealEnd - Ideal end index
   * @returns Adjusted end index at a natural break point
   */
  private findBreakPoint(
    text: string,
    start: number,
    idealEnd: number
  ): number {
    // Look for sentence endings within a reasonable range
    const searchStart = Math.max(start, idealEnd - 200);
    const searchEnd = Math.min(text.length, idealEnd + 200);
    const searchText = text.substring(searchStart, searchEnd);

    // Try to find sentence boundaries (., !, ?)
    const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    let bestBreak = -1;
    let bestDistance = Infinity;

    for (const ending of sentenceEndings) {
      let pos = searchText.lastIndexOf(ending, idealEnd - searchStart);
      while (pos !== -1) {
        const actualPos = searchStart + pos + ending.length;
        const distance = Math.abs(actualPos - idealEnd);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestBreak = actualPos;
        }

        pos = searchText.lastIndexOf(ending, pos - 1);
      }
    }

    // If we found a good sentence break, use it
    if (bestBreak !== -1 && bestDistance < 300) {
      return bestBreak;
    }

    // Try paragraph breaks
    const paragraphBreak = searchText.lastIndexOf('\n\n', idealEnd - searchStart);
    if (paragraphBreak !== -1) {
      return searchStart + paragraphBreak + 2;
    }

    // Try single line breaks
    const lineBreak = searchText.lastIndexOf('\n', idealEnd - searchStart);
    if (lineBreak !== -1) {
      return searchStart + lineBreak + 1;
    }

    // Try word boundaries as last resort
    const spacePos = searchText.lastIndexOf(' ', idealEnd - searchStart);
    if (spacePos !== -1) {
      return searchStart + spacePos + 1;
    }

    // If all else fails, use the ideal end
    return idealEnd;
  }
}

export default new ChunkingService();
