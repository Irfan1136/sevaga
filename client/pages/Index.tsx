import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HeartPulse, Search } from "lucide-react";
import { Api } from "@/lib/api";
import { BloodGroup, TAMIL_NADU_CITIES } from "@shared/api";
import { toast } from "sonner";
import { Suspense, lazy } from "react";
const HeroIllustration = lazy(
  () => import("@/components/sevagan/HeroIllustration"),
);
import DecorativeSVG from "@/components/sevagan/DecorativeSVG";

const BLOOD_GROUPS: BloodGroup[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export default function Index() {
  const [city, setCity] = useState<string>("");
  const [pincode, setPincode] = useState("");
  const [bg, setBg] = useState<BloodGroup | undefined>();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [registeredCount, setRegisteredCount] = useState<number | null>(null);

  const canSearch = useMemo(() => {
    const pinOk = pincode ? pincode.length === 6 : false;
    return !!(bg && (city || pinOk));
  }, [bg, city, pincode]);

  const doSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    try {
      const data = await Api.donors.search({
        bloodGroup: bg,
        city: city || undefined,
        pincode: pincode || undefined,
      });
      // exclude recently featured donors from quick search on home
      const featuredIds = new Set(featuredDonors.map((d) => d.id));
      const filtered = (data.results || []).filter((r: any) => !featuredIds.has(r.id));
      setResults(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const notifyDonor = async (d: any) => {
    // robust notify with timeout and clear errors
    const url = new URL("/api/notify", window.location.href).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: d.mobile,
          donorId: d.id,
          message: `There is a blood request matching your profile. Please check SEVAGAN.`,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Notify failed:", res.status, txt);
        toast.error(`Failed to send notification (${res.status})`);
        return;
      }
      toast.success("Notification sent (dev)");
    } catch (err: any) {
      clearTimeout(timeout);
      if (err && err.name === "AbortError") {
        toast.error("Notification timed out");
      } else {
        console.error("Notify error:", err);
        // Surface user-friendly message without throwing
        toast.error(err?.message || "Failed to send notification");
      }
    }
  };

  const [featuredDonors, setFeaturedDonors] = useState<any[]>([]);

  useEffect(() => {
    // preload stats and featured donors
    (async () => {
      try {
        const s = await fetch("/api/stats").then((r) => r.json());
        // Prefer showing donors count when available
        if (s?.donors !== undefined) setRegisteredCount(s.donors);
        else if (s?.accounts !== undefined) setRegisteredCount(s.accounts);
        else {
          const d = await Api.donors.search({});
          setRegisteredCount(d.total || d.results?.length || 0);
        }
        // capture requestsToday for immediate display
        try {
          (window as any).__requestsToday = s?.requestsToday ?? 0;
        } catch (e) {}

        // fetch featured donors
        const donorsResp = await Api.donors.search({});
        setFeaturedDonors(donorsResp.results.slice(0, 6));

        // auto-seed sample data in dev if none
        if (import.meta.env.MODE === "development") {
          const total = s?.donors ?? s?.accounts ?? 0;
          if (!total) {
            await fetch("/api/admin/seed");
            const s2 = await fetch("/api/stats").then((r) => r.json());
            setRegisteredCount(s2.accounts ?? s2.donors ?? 0);
            const donorsResp2 = await Api.donors.search({});
            setFeaturedDonors(donorsResp2.results.slice(0, 6));
          }
        }
      } catch (e) {
        try {
          const d = await Api.donors.search({});
          setRegisteredCount(d.total || d.results?.length || 0);
          setFeaturedDonors(d.results.slice(0, 6));
        } catch {}
      }
    })();
  }, []);

  const [isAuth, setIsAuth] = useState<boolean>(
    () => !!localStorage.getItem("sevagan_token"),
  );
  useEffect(() => {
    const refreshHandler = async () => {
      try {
        const s = await fetch("/api/stats").then((r) => r.json());
        setRegisteredCount(s?.donors ?? s?.accounts ?? registeredCount);
        const donorsResp = await Api.donors.search({});
        setFeaturedDonors(donorsResp.results.slice(0, 6));
        try {
          (window as any).__requestsToday = s?.requestsToday ?? 0;
        } catch (e) {}
      } catch (err) {
        console.error(err);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "sevagan_token") setIsAuth(!!e.newValue);
      if (e.key === "sevagan_refresh") {
        refreshHandler();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("sevagan_refresh", refreshHandler as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "sevagan_refresh",
        refreshHandler as EventListener,
      );
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-secondary to-background relative overflow-hidden">
      <Suspense fallback={null}>
        <HeroIllustration />
      </Suspense>

      <div className="hero-hearts" aria-hidden>
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMinYMin meet"
        >
          <g fill="hsl(var(--primary))">
            <path
              d="M100 170s-10-6-18-12c-18-12-46-36-46-66 0-14 10-24 22-24 9 0 17 6 22 12 5-6 13-12 22-12 12 0 22 10 22 24 0 30-28 54-46 66-8 6-18 12-18 12z"
              opacity="0.08"
            />
            <path
              d="M160 40c0 12-10 22-22 22s-22-10-22-22 10-22 22-22 22 10 22 22z"
              opacity="0.06"
              fill="rgb(207, 23, 29)"
            />
          </g>
        </svg>
      </div>

      <section
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-10 md:grid-cols-2 items-center relative z-10"
        style={{
          backgroundImage:
            "url(https://cdn.builder.io/api/v1/image/assets%2F042de231e8f8466b9b0bfad5daf79bff%2F4e51967181744d949b8b6f0ff907a67e)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          margin: "0 auto",
          padding: "64px 32px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "rgb(255, 235, 235)",
              borderRadius: 9999,
              color: "rgb(110, 18, 18)",
              fontSize: 12,
              fontWeight: 400,
              gap: 8,
              lineHeight: "16px",
              marginBottom: 16,
              padding: "4px 12px",
            }}
          >
            <HeartPulse className="text-primary" size={16} />
            Real-time donor search across Tamil Nadu
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Find blood donors fast. Save lives faster.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            SEVAGAN connects voluntary donors with patients and hospitals
            instantly. Free, secure, and built for the community.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAuth ? (
              <>
                <a href="/profile">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground btn-raise"
                  >
                    Go to Profile
                  </Button>
                </a>
                <a href="#quick-search">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground btn-raise"
                  >
                    Quick Search
                  </Button>
                </a>
              </>
            ) : (
              <>
                <a href="/signup">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground btn-raise"
                  >
                    Sign Up
                  </Button>
                </a>
                <a href="/login" className="flex items-center">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground btn-raise"
                  >
                    Login
                  </Button>
                </a>
              </>
            )}
            <a href="/register">
              <Button
                variant="ghost"
                size="lg"
                className="bg-primary text-primary-foreground btn-raise"
              >
                Become a Donor
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="quick-search" className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Quick Donor Search</h3>
            <div className="text-sm text-muted-foreground">
              Registered donors:{" "}
              <span className="text-primary font-bold">
                {registeredCount ?? "—"}
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <Select onValueChange={(v) => setBg(v as BloodGroup)}>
              <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setCity}>
              <SelectTrigger className="md:col-span-2">
                <SelectValue placeholder="City (Tamil Nadu)" />
              </SelectTrigger>
              <SelectContent>
                {TAMIL_NADU_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Pincode (6 digits)"
              value={pincode}
              inputMode="numeric"
              maxLength={6}
              onChange={(e) =>
                setPincode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              className="md:col-span-1"
            />
            <Button
              onClick={doSearch}
              disabled={!canSearch || loading}
              className="md:col-span-1"
            >
              <Search className="mr-2" /> {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          {results.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {results.map((d: any) => (
                <div key={d.id} className="rounded-lg border p-4 bg-card">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">
                        {d.name}{" "}
                        <span className="text-primary">{d.bloodGroup}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.city} • {d.pincode}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Age {d.age} • {d.gender}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    Mobile: <span className="font-medium">{d.mobile}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-primary text-white text-sm"
                      onClick={() => void notifyDonor(d)}
                    >
                      Notify
                    </button>
                    <a
                      className="px-3 py-1 rounded border text-sm"
                      href={`/profile?token=dev-token-${d.accountId}`}
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Removed About SEVAGAN section as requested */}

      <section className="bg-secondary/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-3">
          <Stat
            label="Registered Donors"
            value={registeredCount ? String(registeredCount) : "—"}
          />
          <Stat
            label="Requests Today"
            value={String((window as any).__requestsToday || "—")}
          />
          <Stat label="Districts Covered" value={"38"} />
        </div>
        {featuredDonors.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
            <h3 className="text-xl font-semibold mb-4">
              Recent Registered Donors
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {featuredDonors.map((d: any) => (
                <div
                  key={d.id}
                  className="rounded-lg border p-4 bg-card relative overflow-hidden"
                >
                  <div className="absolute right-3 top-3 text-xs px-2 py-1 rounded bg-primary text-primary-foreground font-semibold">
                    {d.bloodGroup}
                  </div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {d.city} • {d.pincode}
                  </div>
                  <div className="mt-2 text-sm">
                    Mobile: <span className="font-medium">{d.mobile}</span>
                  </div>
                  <svg
                    className="recent-card-heart"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      fill="hsl(var(--primary))"
                      d="M12 21s-7-4.35-9-7.2C0.5 10.8 3 6 7 6c2 0 3 1.4 5 3.5C13 7.4 14 6 16 6c4 0 6.5 4.8 4 7.8-2 2.85-9 7.2-9 7.2z"
                      opacity="0.06"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <div className="text-3xl font-extrabold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
