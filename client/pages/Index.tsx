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
const HeroIllustration = lazy(() => import("@/components/sevagan/HeroIllustration"));
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
      setResults(data.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const notifyDonor = async (d: any) => {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: d.mobile,
          donorId: d.id,
          message: `There is a blood request matching your profile. Please check SEVAGAN.`,
        }),
      });
      toast.success("Notification sent (dev)");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send notification");
    }
  };

  useEffect(() => {
    // preload stats
    (async () => {
      try {
        const s = await fetch("/api/stats").then((r) => r.json());
        if (s?.accounts !== undefined) setRegisteredCount(s.accounts);
        else if (s?.donors !== undefined) setRegisteredCount(s.donors);
        else {
          const d = await Api.donors.search({});
          setRegisteredCount(d.total || d.results?.length || 0);
        }
      } catch (e) {
        try {
          const d = await Api.donors.search({});
          setRegisteredCount(d.total || d.results?.length || 0);
        } catch {}
      }
    })();
  }, []);

  const [isAuth, setIsAuth] = useState<boolean>(
    () => !!localStorage.getItem("sevagan_token"),
  );
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "sevagan_token") setIsAuth(!!e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="bg-gradient-to-b from-secondary to-background relative overflow-hidden">
      <Suspense fallback={null}>
        <HeroIllustration />
      </Suspense>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-10 md:grid-cols-2 items-center relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground mb-4">
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
                  <Button variant="outline" size="lg" className="btn-raise">
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
                  <Button variant="outline" size="lg" className="btn-raise">
                    Login
                  </Button>
                </a>
              </>
            )}
            <a href="/register">
              <Button variant="ghost" size="lg" className="btn-raise">
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
                {registeredCount ?? "���"}
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
                      onClick={() => notifyDonor(d)}
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 my-10">
        <div className="rounded-xl border bg-card p-8 shadow-lg">
          <h2 className="text-2xl font-extrabold">About SEVAGAN</h2>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            SEVAGAN is a community-driven platform that connects voluntary blood
            donors to people in urgent need — faster, safer, and free for
            everyone. Built mobile-first for quick response and ease of use.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4 bg-background/50">
              <h4 className="font-semibold">OTP-secured</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Mobile OTP for individuals, email verification for
                organizations.
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-background/50">
              <h4 className="font-semibold">Search & Filter</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Find donors by blood group, city, and pincode instantly.
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-background/50">
              <h4 className="font-semibold">Realtime Requests</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Live request feed for responders and donors.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-3">
          <Stat
            label="Registered Donors"
            value={registeredCount ? String(registeredCount) : "—"}
          />
          <Stat label="Requests Today" value={"—"} />
          <Stat
            label="Cities Covered"
            value={TAMIL_NADU_CITIES.length.toString()}
          />
        </div>
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
