/**
 * Shorten an address / hash for display: `0x1234…abcd`.
 */
export default function shortenString(
  input: string,
  headLen = 6,
  tailLen = 4,
): string {
  if (!input) return "";
  if (input.length <= headLen + tailLen + 1) return input;
  return `${input.slice(0, headLen)}…${input.slice(-tailLen)}`;
}
