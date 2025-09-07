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

  const canSearch = useMemo(
    () => !!(bg && (city || pincode)),
    [bg, city, pincode],
  );

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
    // noop: could preload stats
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
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Why SEVAGAN?</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              • OTP-secured login: mobile for individuals, email for
              NGOs/Hospitals
            </li>
            <li>• Structured database replaces spreadsheets</li>
            <li>• Filter donors by blood group, city, and pincode</li>
            <li>• Request blood with exact need time; notify in real-time</li>
            <li>• Works on mobile, tablet, and desktop</li>
          </ul>
        </div>
      </section>

      <section id="quick-search" className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h3 className="text-xl font-semibold mb-4">Quick Donor Search</h3>
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
              placeholder="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
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
