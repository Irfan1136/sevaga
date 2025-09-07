import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Api } from "@/lib/api";
import { BloodGroup, TAMIL_NADU_CITIES } from "@shared/api";
import { toast } from "sonner";

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

export default function RequestPage() {
  // require login
  useEffect(() => {
    const token = localStorage.getItem("sevagan_token");
    if (!token) window.location.href = "/login";
  }, []);

  const [form, setForm] = useState({
    bloodGroup: undefined as BloodGroup | undefined,
    city: "",
    pincode: "",
    neededAtISO: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodGroup || !form.city || !form.neededAtISO) return;
    setLoading(true);
    try {
      await Api.needs.create(form as any);
      toast.success("Request posted. Donors will be notified.");
      setForm({
        bloodGroup: undefined,
        city: "",
        pincode: "",
        neededAtISO: "",
        notes: "",
      });
    } catch (e: any) {
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  // SSE feed of new requests
  const [feed, setFeed] = useState<any[]>([]);
  const esRef = useRef<EventSource | null>(null);
  useEffect(() => {
    const es = new EventSource(Api.needs.streamUrl);
    esRef.current = es;
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setFeed((f) => [data, ...f].slice(0, 20));
      } catch {}
    };
    return () => es.close();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold mb-6">Request Blood</h1>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              onValueChange={(v) =>
                setForm({ ...form, bloodGroup: v as BloodGroup })
              }
            >
              <SelectTrigger>
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
            <Select onValueChange={(v) => setForm({ ...form, city: v })}>
              <SelectTrigger>
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
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
          </div>
          <Input
            type="datetime-local"
            value={form.neededAtISO}
            onChange={(e) => setForm({ ...form, neededAtISO: e.target.value })}
          />
          <Textarea
            placeholder="Notes (hospital, ward, urgency, etc.)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Live Requests</h2>
        <div className="space-y-3 max-h-[600px] overflow-auto pr-2">
          {feed.map((r, i) => (
            <div key={i} className="rounded-lg border p-4 bg-card">
              <div className="font-semibold">
                <span className="text-primary">{r.bloodGroup}</span> needed in{" "}
                {r.city} ({r.pincode || "—"})
              </div>
              <div className="text-xs text-muted-foreground">
                Need time: {new Date(r.neededAtISO).toLocaleString()}
              </div>
              {r.notes && <div className="mt-2 text-sm">{r.notes}</div>}
            </div>
          ))}
          {feed.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Waiting for requests...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
