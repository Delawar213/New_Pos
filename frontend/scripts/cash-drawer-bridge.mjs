/**
 * Tiny local HTTP bridge: forwards drawer kick to a network receipt printer (port 9100).
 *
 * Usage on the till PC:
 *   set PRINTER_HOST=192.168.1.50
 *   set PRINTER_PORT=9100
 *   node scripts/cash-drawer-bridge.mjs
 *
 * In .env.local:
 *   NEXT_PUBLIC_CASH_DRAWER_ENABLED=true
 *   NEXT_PUBLIC_DRAWER_BRIDGE_URL=http://127.0.0.1:9310/kick
 */

import http from "http";
import net from "net";

const PORT = Number(process.env.DRAWER_BRIDGE_PORT || 9310);
const PRINTER_HOST = process.env.PRINTER_HOST || "127.0.0.1";
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 9100);

const KICK = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);

function sendKick() {
  return new Promise((resolve, reject) => {
    const client = net.connect(PRINTER_PORT, PRINTER_HOST, () => {
      client.write(KICK);
      client.end();
      resolve(true);
    });
    client.on("error", reject);
    client.setTimeout(5000, () => {
      client.destroy();
      reject(new Error("printer connection timeout"));
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && (req.url === "/kick" || req.url === "/open")) {
    try {
      await sendKick();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("drawer opened");
      console.log(`[drawer] kick sent to ${PRINTER_HOST}:${PRINTER_PORT}`);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(String(err?.message || err));
      console.error("[drawer]", err);
    }
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Cash drawer bridge listening on http://127.0.0.1:${PORT}/kick`);
  console.log(`Printer target: ${PRINTER_HOST}:${PRINTER_PORT}`);
});
