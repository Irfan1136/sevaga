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
  const accounts: any[] = []; // persisted in-memory accounts for dev
  const notifications: any[] = [];

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
    if (city)
      results = results.filter(
        (d) => (d.city || "").toLowerCase() === String(city).toLowerCase(),
      );
    if (pincode)
      results = results.filter(
        (d) => String(d.pincode || "").trim() === String(pincode).trim(),
      );
    res.json({ results, total: results.length });
  });

  // Notify (dev-only) - simulate SMS/notification to donor
  app.post("/api/notify", (req, res) => {
    const { mobile, message, donorId } = req.body as any;
    const note = {
      id: String(Date.now()),
      mobile,
      donorId,
      message,
      createdAt: Date.now(),
    };
    notifications.push(note);
    // write to a log file for dev inspection
    try {
      const outDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.appendFileSync(
        path.join(outDir, "notifications.log"),
        JSON.stringify(note) + "\n",
      );
    } catch (err) {
      console.error("Failed to persist notification:", err);
    }
    console.log("[NOTIFY SMS]", mobile, message);
    res.json({ ok: true });
  });

  // simple about endpoint for dynamic content
  app.get("/api/about", (_req, res) => {
    res.json({
      title: "About SEVAGAN",
      hero: "SEVAGAN connects voluntary blood donors to people in urgent need — faster, safer, and completely free.",
      features: [
        "OTP-secured login: mobile for individuals, email for orgs",
        "Search donors by blood group, city, and pincode",
        "Realtime requests and notifications",
      ],
    });
  });

  // stats
  app.get("/api/stats", (_req, res) => {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const requestsToday = needs.filter(
      (n) => n.createdAt >= startOfDay.getTime(),
    ).length;
    res.json({
      donors: donors.length,
      requests: needs.length,
      requestsToday,
      accounts: accounts.length,
    });
  });

  // needs
  app.post("/api/needs", (req, res) => {
    const body = req.body as any;
    const need = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
      ...body,
    } as any;
    // attach requesterName if requesterAccountId provided
    if (body.requesterAccountId && !need.requesterName) {
      const acc = accounts.find((a) => a.id === body.requesterAccountId);
      if (acc) need.requesterName = acc.name;
    }
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

  // list needs
  app.get("/api/needs", (_req, res) => {
    res.json(needs.slice().reverse());
  });

  // get single need by id
  app.get("/api/needs/:id", (req, res) => {
    const id = req.params.id;
    const n = needs.find((m) => m.id === id);
    if (!n) return res.status(404).json({ error: "Not found" });
    res.json(n);
  });

  // respond to a need - donor expresses intent to donate
  app.post("/api/needs/respond", (req, res) => {
    const { needId, contact, message, donorName } = req.body as any;
    const need = needs.find((n) => n.id === needId);
    if (!need) return res.status(404).json({ error: "Need not found" });
    const resp = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
      needId,
      contact,
      donorName,
      message: message || "I can donate",
      createdAt: Date.now(),
    };
    // persist to notifications for admin inspection
    notifications.push(resp);
    // also write to log for dev
    try {
      const outDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.appendFileSync(
        path.join(outDir, "responses.log"),
        JSON.stringify(resp) + "\n",
      );
    } catch (err) {
      console.error("Failed to persist response:", err);
    }
    // If the need requester has contact (requesterAccountId matches an account with mobile/email), notify them
    let recipients: string[] = [];
    if (need.requesterAccountId) {
      const acc = accounts.find((a) => a.id === need.requesterAccountId);
      if (acc) {
        if (acc.mobile) recipients.push(acc.mobile);
        if (acc.email) recipients.push(acc.email);
      }
    }
    // fallback: if need has pincode/city we won't notify automatically
    // add donor contact to recipients so admin can see
    if (contact) recipients.push(contact);

    // dedupe and log
    recipients = Array.from(new Set(recipients));
    console.log("[NEED RESPONSE]", resp, "notify:", recipients);
    res.json({ ok: true, resp, notifyTo: recipients });
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
          const masterName = path.join(outDir, `sevagan.csv`);
          const exists = fs.existsSync(masterName);
          const masterRow =
            row
              .map((v: any) => `"${String(v).replace(/"/g, '""')}"`)
              .join(",") + "\n";
          if (!exists) {
            fs.writeFileSync(masterName, headers.join(",") + "\n" + masterRow, {
              encoding: "utf-8",
            });
          } else {
            fs.appendFileSync(masterName, masterRow, { encoding: "utf-8" });
          }
          // also append html xls master
          const masterXls = path.join(outDir, `sevagan.xls`);
          const masterHtmlRow = `<tr>${row.map((r: any) => `<td>${String(r)}</td>`).join("")}</tr>`;
          if (!fs.existsSync(masterXls)) {
            const masterHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${masterHtmlRow}</tbody></table></body></html>`;
            fs.writeFileSync(masterXls, masterHtml, { encoding: "utf-8" });
          } else {
            // insert before </tbody>
            const cur = fs.readFileSync(masterXls, "utf-8");
            const updated = cur.replace(
              "</tbody></table>",
              masterHtmlRow + "</tbody></table>",
            );
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

    // Find if an account exists for the provided mobile/email and collect recipients
    const recipients: string[] = [];
    if (mobile || email) {
      // find account by mobile or email
      const acc = accounts.find(
        (a) => a.mobile === mobile || a.email === email,
      );
      if (acc) {
        if (acc.mobile) recipients.push(acc.mobile);
        if (acc.email) recipients.push(acc.email);
      } else {
        if (mobile) recipients.push(mobile);
        if (email) recipients.push(email);
      }
    } else {
      // fallback to accountType key
      recipients.push(accountType);
    }

    // de-dupe recipients
    const uniq = Array.from(new Set(recipients));

    // store OTP under each recipient so verification can use any of them
    uniq.forEach((r) => {
      otps[r] = { code, expiresAt: Date.now() + 1000 * 60 * 5 };
    });

    const resp: any = { requestId: key, channels: [] as string[] };
    uniq.forEach((r) => {
      if (/^\d{10}$/.test(r)) resp.channels.push("sms");
      else if (/@/.test(r)) resp.channels.push("email");
      else resp.channels.push("other");
    });

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
    // create fake account and persist
    const account = {
      id: String(Date.now()),
      type: accountType,
      name: mobile || email,
      mobile: mobile || undefined,
      email: email || undefined,
      createdAt: Date.now(),
      verifiedAt: Date.now(),
    };
    accounts.push(account);
    const token = "dev-token-" + account.id;
    res.json({ token, account });
  });

  app.get("/api/me", (req, res) => {
    const auth = (req.headers["authorization"] ||
      req.headers["Authorization"]) as string | undefined;
    if (!auth) return res.status(401).json({ error: "Not Authorized" });
    const token = auth.replace(/^Bearer\s+/i, "");
    const id = token.replace(/^dev-token-/, "");
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return res.status(401).json({ error: "Not Authorized" });
    // also return donor info if present
    const donor = donors.find(
      (d) => d.mobile === acc.mobile || d.email === acc.email,
    );
    res.json({ account: acc, donor: donor || null });
  });

  // update profile (dev-only)
  app.post("/api/me", (req, res) => {
    const auth = (req.headers["authorization"] ||
      req.headers["Authorization"]) as string | undefined;
    if (!auth) return res.status(401).json({ error: "Not Authorized" });
    const token = auth.replace(/^Bearer\s+/i, "");
    const id = token.replace(/^dev-token-/, "");
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return res.status(401).json({ error: "Not Authorized" });

    const { name, mobile, email, avatarBase64 } = req.body as any;
    if (name) acc.name = name;
    if (mobile) acc.mobile = mobile;
    if (email) acc.email = email;
    if (avatarBase64) acc.avatarBase64 = avatarBase64;
    // sync donor records that belong to this account
    donors.forEach((d) => {
      if (d.accountId === acc.id) {
        if (mobile) d.mobile = mobile;
        if (email) d.email = email;
      }
      // also try to match by previous mobile/email
      if (acc.mobile && (d.mobile === acc.mobile || d.email === acc.email)) {
        if (mobile) d.mobile = mobile;
        if (email) d.email = email;
      }
    });

    res.json({ ok: true, account: acc });
  });

  // client-side JS error logging (for debugging in preview)
  app.post("/api/client-log", (req, res) => {
    try {
      console.error("[CLIENT ERROR LOG]", JSON.stringify(req.body));
    } catch (e) {
      console.error("[CLIENT ERROR LOG] failed to stringify", e);
    }
    res.json({ ok: true });
  });

  // Admin/dev helpers
  app.get("/api/admin/data", (_req, res) => {
    res.json({
      accounts,
      donors,
      needs,
      notifications,
      stats: {
        donors: donors.length,
        requests: needs.length,
        accounts: accounts.length,
      },
    });
  });

  app.get("/api/admin/seed", (_req, res) => {
    // seed some sample accounts and donors if empty
    if (accounts.length === 0) {
      const a1 = {
        id: "1",
        type: "individual",
        name: "ALICE",
        mobile: "9990001111",
        email: undefined,
        createdAt: Date.now(),
        verifiedAt: Date.now(),
      };
      const a2 = {
        id: "2",
        type: "hospital",
        name: "CITY HOSPITAL",
        mobile: undefined,
        email: "hospital@example.com",
        createdAt: Date.now(),
        verifiedAt: Date.now(),
      };
      accounts.push(a1, a2);
    }
    if (donors.length === 0) {
      donors.push(
        {
          id: "D1",
          name: "ALICE",
          age: 30,
          gender: "female",
          bloodGroup: "A+",
          city: "CHENNAI",
          pincode: "600001",
          mobile: "9990001111",
          createdAt: Date.now(),
          accountId: "1",
        },
        {
          id: "D2",
          name: "BOB",
          age: 40,
          gender: "male",
          bloodGroup: "O+",
          city: "COIMBATORE",
          pincode: "641001",
          mobile: "8880002222",
          createdAt: Date.now(),
        },
        {
          id: "D3",
          name: "CHARLIE",
          age: 28,
          gender: "male",
          bloodGroup: "B+",
          city: "MADURAI",
          pincode: "625001",
          mobile: "7770003333",
          createdAt: Date.now(),
        },
        {
          id: "D4",
          name: "DIVYA",
          age: 35,
          gender: "female",
          bloodGroup: "AB+",
          city: "TIRUCHIRAPPALLI",
          pincode: "620001",
          mobile: "6660004444",
          createdAt: Date.now(),
        },
        {
          id: "D5",
          name: "EVELYN",
          age: 22,
          gender: "female",
          bloodGroup: "O-",
          city: "SALEM",
          pincode: "636001",
          mobile: "5550005555",
          createdAt: Date.now(),
        },
        {
          id: "D6",
          name: "FARHAN",
          age: 31,
          gender: "male",
          bloodGroup: "A-",
          city: "TIRUNELVELI",
          pincode: "627001",
          mobile: "4440006666",
          createdAt: Date.now(),
        },
        {
          id: "D7",
          name: "GOPI",
          age: 45,
          gender: "male",
          bloodGroup: "AB-",
          city: "TIRUPPUR",
          pincode: "641601",
          mobile: "3330007777",
          createdAt: Date.now(),
        },
        {
          id: "D8",
          name: "HARI",
          age: 29,
          gender: "male",
          bloodGroup: "B-",
          city: "ERODE",
          pincode: "638001",
          mobile: "2220008888",
          createdAt: Date.now(),
        },
        {
          id: "D9",
          name: "INDIRA",
          age: 38,
          gender: "female",
          bloodGroup: "A+",
          city: "VELLORE",
          pincode: "632001",
          mobile: "1110009999",
          createdAt: Date.now(),
        },
        {
          id: "D10",
          name: "JAYA",
          age: 33,
          gender: "female",
          bloodGroup: "O+",
          city: "THOOTHUKUDI",
          pincode: "628001",
          mobile: "0001112223",
          createdAt: Date.now(),
        },
      );
    }

    // seed some sample needs if empty
    if (needs.length === 0) {
      const now = Date.now();
      needs.push(
        {
          id: "N1",
          bloodGroup: "B+",
          city: "ERODE",
          pincode: "638001",
          neededAtISO: new Date(now + 30 * 60 * 1000).toISOString(), // within 1 hour
          notes: "ICU - immediate",
          requesterAccountId: "2",
          requesterName: "CITY HOSPITAL",
          createdAt: now - 5 * 60 * 1000,
        },
        {
          id: "N2",
          bloodGroup: "O+",
          city: "CHENNAI",
          pincode: "600001",
          neededAtISO: new Date(now + 3 * 60 * 60 * 1000).toISOString(), // urgent (3 hours)
          notes: "Ward 4B - surgery scheduled",
          requesterAccountId: "2",
          requesterName: "CITY HOSPITAL",
          createdAt: now - 30 * 60 * 1000,
        },
        {
          id: "N3",
          bloodGroup: "A+",
          city: "COIMBATORE",
          pincode: "641001",
          neededAtISO: new Date(now + 8 * 60 * 60 * 1000).toISOString(), // later today
          notes: "Family request, urgent but later today",
          requesterAccountId: "1",
          requesterName: "ALICE",
          createdAt: now - 60 * 60 * 1000,
        },
        {
          id: "N4",
          bloodGroup: "AB-",
          city: "MADURAI",
          pincode: "625001",
          neededAtISO: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(), // upcoming in 2 days
          notes: "Planned transfusion",
          requesterAccountId: "1",
          requesterName: "ALICE",
          createdAt: now - 2 * 60 * 60 * 1000,
        },
      );
    }
    res.json({ ok: true });
  });

  app.post("/api/admin/clear", (_req, res) => {
    accounts.length = 0;
    donors.length = 0;
    needs.length = 0;
    notifications.length = 0;
    res.json({ ok: true });
  });

  return app;
}
