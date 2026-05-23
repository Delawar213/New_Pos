/**
 * Cash drawer kick (ESC/POS) for thermal receipt printers.
 *
 * Setup (pick one):
 * 1. Local bridge — run `node scripts/cash-drawer-bridge.mjs` on the till PC, set in .env.local:
 *    NEXT_PUBLIC_CASH_DRAWER_ENABLED=true
 *    NEXT_PUBLIC_DRAWER_BRIDGE_URL=http://127.0.0.1:9310/kick
 *    PRINTER_HOST=192.168.x.x  (printer IP, port 9100 usually)
 *
 * 2. QZ Tray — install https://qz.io/download/, set:
 *    NEXT_PUBLIC_QZ_TRAY_ENABLED=true
 */

/** ESC p — pin 0, 25ms on, 250ms off (common Epson/Star drawers). */
export const CASH_DRAWER_KICK_HEX = "1B700019FA";

export const CASH_DRAWER_KICK_BYTES = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);

export function getCashAccountId(): number {
  const n = Number(process.env.NEXT_PUBLIC_CASH_ACCOUNT_ID);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function isCashDrawerEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CASH_DRAWER_ENABLED === "true";
}

export function isQzTrayEnabled(): boolean {
  return process.env.NEXT_PUBLIC_QZ_TRAY_ENABLED === "true";
}

export function getDrawerBridgeUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_DRAWER_BRIDGE_URL?.trim();
  return url || null;
}

/** Resolve which account receives cash paid now (matches POS API payload). */
export function resolveReceiveIntoAccountId(
  paidAmount: number,
  posBankAccountId: number,
  cashAccountId = getCashAccountId()
): number {
  if (paidAmount <= 0) return 0;
  return Math.max(cashAccountId, posBankAccountId || cashAccountId);
}

export function shouldOpenCashDrawer(opts: {
  paidAmount: number;
  bankAccountId: number;
  cashAccountId?: number;
}): boolean {
  if (!isCashDrawerEnabled()) return false;
  const cashId = opts.cashAccountId ?? getCashAccountId();
  if (opts.paidAmount <= 0.009) return false;
  return opts.bankAccountId === cashId;
}

type QzPrintData = { type: string; format: string; data: string };
type QzConfigs = { create: (printer: string) => unknown };
type QzApi = {
  websocket: { connect: () => Promise<void>; isActive: () => boolean };
  printers: { getDefault: () => Promise<string> };
  configs: QzConfigs;
  print: (config: unknown, data: QzPrintData[]) => Promise<void>;
};

function getQz(): QzApi | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { qz?: QzApi };
  return w.qz ?? null;
}

async function openViaBridge(): Promise<boolean> {
  const url = getDrawerBridgeUrl();
  if (!url) return false;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command: "drawer", hex: CASH_DRAWER_KICK_HEX }),
    signal: AbortSignal.timeout(4000),
  });
  return res.ok;
}

async function openViaQzTray(): Promise<boolean> {
  const qz = getQz();
  if (!qz) return false;

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
  const printer = await qz.printers.getDefault();
  if (!printer) return false;
  const config = qz.configs.create(printer);
  await qz.print(config, [{ type: "raw", format: "hex", data: CASH_DRAWER_KICK_HEX }]);
  return true;
}

/**
 * Send drawer-open command. Never throws — sale must not fail if drawer is offline.
 */
export async function openCashDrawer(): Promise<boolean> {
  if (!isCashDrawerEnabled()) return false;

  const errors: string[] = [];

  if (getDrawerBridgeUrl()) {
    try {
      if (await openViaBridge()) return true;
      errors.push("bridge returned non-OK");
    } catch (e) {
      errors.push(`bridge: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (isQzTrayEnabled()) {
    try {
      if (await openViaQzTray()) return true;
      errors.push("QZ Tray print failed");
    } catch (e) {
      errors.push(`QZ: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (errors.length > 0) {
    console.warn("[cash drawer]", errors.join("; "));
  } else if (!getDrawerBridgeUrl() && !isQzTrayEnabled()) {
    console.warn(
      "[cash drawer] Enabled but no NEXT_PUBLIC_DRAWER_BRIDGE_URL or NEXT_PUBLIC_QZ_TRAY_ENABLED"
    );
  }
  return false;
}

/** Open drawer when paid amount goes to the cash/till account (walk-in or credit partial). */
export async function openCashDrawerIfNeeded(opts: {
  paidAmount: number;
  bankAccountId: number;
  cashAccountId?: number;
}): Promise<boolean> {
  if (!shouldOpenCashDrawer(opts)) return false;
  return openCashDrawer();
}
