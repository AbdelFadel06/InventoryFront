// Normalize a KeyboardEvent character regardless of OS keyboard layout.
// Barcode scanners simulate keypresses; on AZERTY the digit keys produce
// &é"'(-è_çà instead of 1234567890 when Shift is not held.
// Using e.code (physical key position) avoids the layout issue entirely.
// The AZERTY map is a fallback for environments where e.code is unreliable.

const AZERTY_TO_DIGIT: Record<string, string> = {
  "&": "1", "é": "2", '"': "3", "'": "4", "(": "5",
  "-": "6", "è": "7", "_": "8", "ç": "9", "à": "0",
};

export function getScannedChar(e: KeyboardEvent): string | null {
  if (/^Digit(\d)$/.test(e.code)) return e.code.slice(5);
  if (/^Numpad(\d)$/.test(e.code)) return e.code.slice(6);
  if (/^Key([A-Z])$/.test(e.code)) {
    const letter = e.code.slice(3);
    return e.shiftKey ? letter : letter.toLowerCase();
  }
  if (e.key in AZERTY_TO_DIGIT) return AZERTY_TO_DIGIT[e.key];
  if (e.key.length === 1 && /[\x20-\x7E]/.test(e.key)) return e.key;
  return null;
}

// Normalize a raw string that may contain AZERTY digit chars.
// Useful when a plain <input> captured scanner output directly.
export function normalizeBarcode(raw: string): string {
  return raw.split("").map(ch => AZERTY_TO_DIGIT[ch] ?? ch).join("");
}
