import { useCallback, useEffect, useRef, useState } from "react";

export type HIDScannerStatus = "unsupported" | "disconnected" | "connecting" | "connected";

interface UseHIDScannerOptions {
  onBarcode: (code: string) => void;
  /** Minimum barcode length to consider valid (avoid phantom short reads) */
  minLength?: number;
}

export function useHIDScanner({ onBarcode, minLength = 4 }: UseHIDScannerOptions) {
  const [status, setStatus] = useState<HIDScannerStatus>(
    typeof navigator !== "undefined" && "hid" in navigator ? "disconnected" : "unsupported"
  );
  const deviceRef = useRef<HIDDevice | null>(null);

  // Decode a raw HID inputreport into a barcode string.
  // HID POS reports vary by manufacturer but the barcode data is always
  // a run of printable ASCII bytes. We extract the longest such run.
  const decodeReport = useCallback((data: DataView): string => {
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    let best = "";
    let current = "";

    for (const b of bytes) {
      if (b >= 0x20 && b <= 0x7E) {
        current += String.fromCharCode(b);
      } else {
        if (current.length > best.length) best = current;
        current = "";
      }
    }
    if (current.length > best.length) best = current;
    return best.trim();
  }, []);

  const connect = useCallback(async () => {
    if (!("hid" in navigator)) return;
    setStatus("connecting");
    try {
      // Prompt the user to pick a HID device (shows all HID devices)
      const devices: HIDDevice[] = await (navigator as any).hid.requestDevice({ filters: [] });
      if (!devices.length) { setStatus("disconnected"); return; }

      const device = devices[0];
      await device.open();
      deviceRef.current = device;
      setStatus("connected");

      device.addEventListener("inputreport", (e: Event) => {
        const ev = e as HIDInputReportEvent;
        const code = decodeReport(ev.data);
        if (code.length >= minLength) onBarcode(code);
      });

      // Auto-reconnect on unexpected disconnect
      device.addEventListener("close", () => setStatus("disconnected"));
    } catch {
      setStatus("disconnected");
    }
  }, [decodeReport, minLength, onBarcode]);

  const disconnect = useCallback(async () => {
    const d = deviceRef.current;
    if (!d) return;
    try { await d.close(); } catch { /* ignore */ }
    deviceRef.current = null;
    setStatus("disconnected");
  }, []);

  // Clean up on unmount
  useEffect(() => () => { disconnect(); }, [disconnect]);

  return { status, connect, disconnect };
}
