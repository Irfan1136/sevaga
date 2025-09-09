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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
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
  "Other",
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
    date: "",
    timeOption: "within_1_hour",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodGroup || !form.city || !form.date) return;
    setLoading(true);
    try {
      // compute neededAtISO based on date and timeOption
      const selectedDate = new Date(form.date + "T00:00:00");
      const today = new Date();
      let baseTime = selectedDate;
      // if date is today, baseTime = now
      if (
        selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getDate() === today.getDate()
      ) {
        baseTime = new Date();
      } else {
        // set to 9 AM of selected date
        baseTime = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          9,
          0,
          0,
        );
      }
      const opt = form.timeOption;
      let offsetMs = 0;
      if (opt === "emergency")
        offsetMs = 15 * 60 * 1000; // 15 min
      else if (opt === "within_1_hour") offsetMs = 60 * 60 * 1000;
      else if (opt === "within_5_hours") offsetMs = 5 * 60 * 60 * 1000;
      else if (opt === "today") offsetMs = 12 * 60 * 60 * 1000; // midday

      const neededAtISO = new Date(baseTime.getTime() + offsetMs).toISOString();

      const payload: any = {
        bloodGroup: form.bloodGroup,
        city: form.city,
        pincode: form.pincode,
        neededAtISO,
        timeOption: form.timeOption,
        notes: form.notes,
      };

      // attach requester info if available
      try {
        const me = await Api.auth.me();
        if (me && me.account) {
          payload.requesterAccountId = me.account.id;
          payload.requesterName = me.account.name;
        }
      } catch {}

      await Api.needs.create(payload as any);
      toast.success("Request posted. Donors will be notified.");
      setForm({
        bloodGroup: undefined,
        city: "",
        pincode: "",
        date: "",
        timeOption: "within_1_hour",
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
  const [responded, setResponded] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<any | null>(null);
  const [contactInput, setContactInput] = useState("");
  const [dialogMode, setDialogMode] = useState<"donate" | "share" | null>(null);
  useEffect(() => {
    // load existing needs
    let mounted = true;
    Api.needs
      .list()
      .then((list) => {
        if (!mounted) return;
        setFeed(list.slice(0, 20));
      })
      .catch(() => {});
    const es = new EventSource(Api.needs.streamUrl);
    esRef.current = es;
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setFeed((f) => [data, ...f].slice(0, 20));
      } catch {}
    };
    return () => {
      mounted = false;
      es.close();
    };
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
            type="date"
            value={(form as any).date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Select
            onValueChange={(v) => setForm({ ...form, timeOption: v })}
            defaultValue={(form as any).timeOption}
          >
            <SelectTrigger>
              <SelectValue placeholder="When needed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emergency">Emergency (ASAP)</SelectItem>
              <SelectItem value="within_1_hour">Within 1 hour</SelectItem>
              <SelectItem value="within_5_hours">Within 5 hours</SelectItem>
              <SelectItem value="today">Today</SelectItem>
            </SelectContent>
          </Select>
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
          {feed.map((r, i) => {
            const now = Date.now();
            const needed = new Date(r.neededAtISO).getTime();
            const diffSec = (needed - now) / 1000;
            const optionMap: Record<string,string> = {
              emergency: 'Emergency',
              within_1_hour: 'Within 1 hour',
              within_5_hours: 'Within 5 hours',
              today: 'Today',
            };
            let tag = '';
            if (r.timeOption && optionMap[r.timeOption]) tag = optionMap[r.timeOption];
            else if (diffSec <= 3600) tag = "Within 1 hour";
            else if (diffSec <= 2 * 3600) tag = "Urgent";
            else {
              const nd = new Date(needed);
              const today = new Date();
              if (
                nd.getFullYear() === today.getFullYear() &&
                nd.getMonth() === today.getMonth() &&
                nd.getDate() === today.getDate()
              )
                tag = "Today";
              else tag = nd.toLocaleString();
            }
            const s = Math.floor(
              (Date.now() - (r.createdAt || Date.now())) / 1000,
            );
            const timeAgo =
              s < 60
                ? `${s}s ago`
                : s < 3600
                  ? `${Math.floor(s / 60)}m ago`
                  : s < 86400
                    ? `${Math.floor(s / 3600)}h ago`
                    : new Date(r.createdAt).toLocaleString();
            return (
              <div key={r.id || i} className="rounded-lg border p-4 bg-card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="font-semibold">
                        <span className="text-primary">{r.bloodGroup}</span>{" "}
                        needed in {r.city} ({r.pincode || "—"})
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                        {tag}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Requested by:{" "}
                      <span className="font-medium">
                        {r.requesterName || r.requesterAccountId || "—"}
                      </span>{" "}
                      · <span className="text-[11px]">{timeAgo}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-sm px-3 py-1 rounded bg-red-600 text-white"
                      onClick={async () => {
                        const url = `${location.origin}/requests/${r.id}`;
                        if ((navigator as any).share) {
                          try {
                            await (navigator as any).share({
                              title: "Blood request",
                              text: `${r.bloodGroup} needed in ${r.city}`,
                              url,
                            });
                            toast.success("Request shared");
                            return;
                          } catch (e) {
                            // fallthrough to copy
                          }
                        }
                        try {
                          await navigator.clipboard.writeText(url);
                          toast.success("Request link copied");
                        } catch (e) {
                          toast.error("Failed to copy link");
                        }
                      }}
                    >
                      Share
                    </button>
                    <button
                      className="text-sm px-3 py-1 rounded border"
                      disabled={responded.includes(r.id)}
                      onClick={() => {
                        setSelectedNeed(r);
                        setContactInput("");
                        setDialogMode("donate");
                        setDialogOpen(true);
                      }}
                    >
                      {responded.includes(r.id) ? "Responded" : "Donate"}
                    </button>
                  </div>
                </div>
                {r.notes && <div className="mt-2 text-sm">{r.notes}</div>}
              </div>
            );
          })}
          {feed.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Waiting for requests...
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "donate"
                ? "Share contact to requestor"
                : "Contact"}
            </DialogTitle>
            <DialogDescription>
              Enter a mobile number or email so the requester can contact you
              about donating.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Input
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              placeholder="Mobile number or email"
            />
          </div>
          <DialogFooter>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={async () => {
                  if (!selectedNeed) return;
                  if (!contactInput) {
                    toast.error("Contact required");
                    return;
                  }
                  try {
                    await Api.needs.respond({
                      needId: selectedNeed.id,
                      contact: contactInput,
                      message: "I can donate",
                    });
                    setResponded((s) =>
                      selectedNeed ? [...s, selectedNeed.id] : s,
                    );
                    toast.success("Response sent. Requester will be notified.");
                    setDialogOpen(false);
                  } catch (err) {
                    toast.error("Failed to send response");
                  }
                }}
              >
                Send
              </button>
              <button
                className="px-3 py-1 rounded border"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </button>
            </div>
          </DialogFooter>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </div>
  );
}
