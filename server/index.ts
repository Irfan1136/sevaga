import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import fs from "fs";
import path from "path";

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
    const donor = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
      ...body,
    };
    donors.push(donor);
    res.json(donor);
  });

  app.get("/api/donors", (req, res) => {
    const { bloodGroup, city, pincode } = req.query as Record<string, string>;
    let results = donors.slice().reverse();
    if (bloodGroup)
      results = results.filter((d) => d.bloodGroup === bloodGroup);
    if (city) results = results.filter((d) => d.city === city);
    if (pincode) results = results.filter((d) => d.pincode === pincode);
    res.json({ results, total: results.length });
  });

  // needs
  app.post("/api/needs", (req, res) => {
    const body = req.body;
    const need = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
      ...body,
    };
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
    const { accountType, mobile, email, profile } = req.body as any;
    const key = mobile || email || accountType;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otps[key] = { code, expiresAt: Date.now() + 1000 * 60 * 5 };
    console.log("[DEV OTP]", key, code);

    // If profile data provided, save to CSV file (dev / zero-cost persistence)
    try {
      if (profile) {
        const outDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const identifier = profile.email || profile.mobile || key || "user";
        // sanitize filename
        const safe = identifier.replace(/[^a-z0-9@.\-\_]/gi, "_");
        const filename = path.join(outDir, `${safe}.csv`);
        const headers = [
          "name",
          "type",
          "email",
          "mobile",
          "bloodGroup",
          "gender",
          "dob",
          "city",
          "pincode",
          "createdAt",
        ];
        const row = [
          profile.name || "",
          accountType || "",
          profile.email || "",
          profile.mobile || "",
          profile.bloodGroup || "",
          profile.gender || "",
          profile.dob || "",
          profile.city || "",
          profile.pincode || "",
          new Date().toISOString(),
        ];
        const csv =
          headers.join(",") +
          "\n" +
          row.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",") +
          "\n";
        fs.writeFileSync(filename, csv, { encoding: "utf-8" });
        // also write a simple Excel-compatible .xls (HTML) file so it opens in Excel
        try {
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers
            .map((h) => `<th>${h}</th>`)
            .join("")}</tr></thead><tbody><tr>${row
            .map((r) => `<td>${String(r)}</td>`)
            .join("")}</tr></tbody></table></body></html>`;
          const xlsFile = path.join(outDir, `${safe}.xls`);
          fs.writeFileSync(xlsFile, html, { encoding: "utf-8" });
          console.log("[DEV XLS] Saved signup profile to", xlsFile);
        } catch (err) {
          console.error("Failed to write XLS fallback:", err);
        }
        // Append to master file for irsparks011@gmail.com
        try {
          const masterName = path.join(outDir, `irsparks011@gmail.com.csv`);
          const exists = fs.existsSync(masterName);
          const masterRow = row.map((v:any)=>`"${String(v).replace(/"/g,'""')}"`).join(",") + "\n";
          if (!exists) {
            fs.writeFileSync(masterName, headers.join(",") + "\n" + masterRow, { encoding: "utf-8" });
          } else {
            fs.appendFileSync(masterName, masterRow, { encoding: "utf-8" });
          }
          // also append html xls master
          const masterXls = path.join(outDir, `irsparks011@gmail.com.xls`);
          const masterHtmlRow = `<tr>${row.map((r:any)=>`<td>${String(r)}</td>`).join("")}</tr>`;
          if (!fs.existsSync(masterXls)) {
            const masterHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${masterHtmlRow}</tbody></table></body></html>`;
            fs.writeFileSync(masterXls, masterHtml, { encoding: "utf-8" });
          } else {
            // insert before </tbody>
            const cur = fs.readFileSync(masterXls, "utf-8");
            const updated = cur.replace("</tbody></table>", masterHtmlRow + "</tbody></table>");
            fs.writeFileSync(masterXls, updated, { encoding: "utf-8" });
          }
          console.log("[DEV MASTER] Appended signup to master csv/xls");
        } catch (err) {
          console.error("Failed to append to master file:", err);
        }
        console.log("[DEV CSV] Saved signup profile to", filename);
      }
    } catch (err) {
      console.error("Failed to save signup CSV:", err);
    }

    const resp: any = { requestId: key, channel: mobile ? "sms" : "email" };
    // expose OTP code in dev for easier testing
    if (process.env.NODE_ENV !== "production") resp.devCode = code;
    res.json(resp);
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { accountType, mobile, email, otp } = req.body as any;
    const key = mobile || email || accountType;
    const rec = otps[key];
    if (!rec) return res.status(400).json({ error: "No OTP requested" });
    if (rec.expiresAt < Date.now())
      return res.status(400).json({ error: "OTP expired" });
    if (rec.code !== otp) return res.status(400).json({ error: "Invalid OTP" });
    // create fake account
    const account = {
      id: String(Date.now()),
      type: accountType,
      name: mobile || email,
      mobile: mobile || undefined,
      email: email || undefined,
      createdAt: Date.now(),
      verifiedAt: Date.now(),
    };
    res.json({ token: "dev-token-" + account.id, account });
  });

  return app;
}
