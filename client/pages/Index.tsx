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
  const [about, setAbout] = useState<any | null>(null);
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

  useEffect(() => {
    // preload about and stats
    (async () => {
      try {
        const ab = await fetch('/api/about').then((r) => r.json());
        setAbout(ab);
      } catch (e) {}
      try {
        const s = await fetch('/api/stats').then((r) => r.json());
        if (s?.donors !== undefined) setRegisteredCount(s.donors);
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

  return (
    <div className="bg-gradient-to-b from-secondary to-background">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-10 md:grid-cols-2 items-center">
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
            <a href="#quick-search">
              <Button size="lg">
                <Search className="mr-2" /> Quick Search
              </Button>
            </a>
            <a href="/register">
              <Button variant="outline" size="lg">
                Become a Donor
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="quick-search" className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {about && (
            <div className="rounded-lg border bg-card p-6 mb-6">
              <h3 className="text-lg font-semibold">{about.title}</h3>
              <p className="mt-2 text-muted-foreground">{about.hero}</p>
              {about.features && (
                <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {about.features.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Quick Donor Search</h3>
            <div className="text-sm text-muted-foreground">Registered donors: <span className="text-primary font-bold">{registeredCount ?? '—'}</span></div>
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
              onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-secondary/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-3">
          <Stat label="Registered Donors" value={"—"} />
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
