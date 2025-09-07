import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Simple in-memory stores for dev/testing
  const donors: any[] = [];
  const needs: any[] = [];
  const otps: Record<string, { code: string; expiresAt: number }> = {};

  // donors
  app.post("/api/donors", (req, res) => {
    const body = req.body;
    const donor = { id: String(Date.now()) + Math.random().toString(36).slice(2, 8), createdAt: Date.now(), ...body };
    donors.push(donor);
    res.json(donor);
  });

  app.get("/api/donors", (req, res) => {
    const { bloodGroup, city, pincode } = req.query as Record<string, string>;
    let results = donors.slice().reverse();
    if (bloodGroup) results = results.filter((d) => d.bloodGroup === bloodGroup);
    if (city) results = results.filter((d) => d.city === city);
    if (pincode) results = results.filter((d) => d.pincode === pincode);
    res.json({ results, total: results.length });
  });

  // needs
  app.post("/api/needs", (req, res) => {
    const body = req.body;
    const need = { id: String(Date.now()) + Math.random().toString(36).slice(2, 8), createdAt: Date.now(), ...body };
    needs.push(need);
    // notify via SSE clients
    sseClients.forEach((s) => s.sendEvent(JSON.stringify(need)));
    res.json(need);
  });

  // SSE stream for needs
  const sseClients: Array<{ sendEvent: (d: string) => void }> = [];
  app.get("/api/needs/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const send = (d: string) => res.write(`data: ${d}\n\n`);
    sseClients.push({ sendEvent: send });
    req.on("close", () => {
      const idx = sseClients.findIndex((c) => c.sendEvent === send);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // auth otp (dev-only) - generate and verify
  app.post("/api/auth/request-otp", (req, res) => {
    const { accountType, mobile, email } = req.body as any;
    const key = mobile || email || accountType;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otps[key] = { code, expiresAt: Date.now() + 1000 * 60 * 5 };
    console.log("[DEV OTP]", key, code);
    res.json({ requestId: key, channel: mobile ? "sms" : "email" });
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { accountType, mobile, email, otp } = req.body as any;
    const key = mobile || email || accountType;
    const rec = otps[key];
    if (!rec) return res.status(400).json({ error: "No OTP requested" });
    if (rec.expiresAt < Date.now()) return res.status(400).json({ error: "OTP expired" });
    if (rec.code !== otp) return res.status(400).json({ error: "Invalid OTP" });
    // create fake account
    const account = { id: String(Date.now()), type: accountType, name: mobile || email, mobile: mobile || undefined, email: email || undefined, createdAt: Date.now(), verifiedAt: Date.now() };
    res.json({ token: "dev-token-" + account.id, account });
  });

  return app;
}
