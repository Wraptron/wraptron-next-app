/** Max UTF-8 size for requirement markdown (matches backend validation). */
export const REQUIREMENT_MARKDOWN_MAX_BYTES = 200 * 1024;

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

export function isMarkdownWithinLimit(text: string): boolean {
  return utf8ByteLength(text) <= REQUIREMENT_MARKDOWN_MAX_BYTES;
}
