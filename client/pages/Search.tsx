import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Api } from "@/lib/api";
import { BloodGroup, TAMIL_NADU_CITIES } from "@shared/api";
import { Search } from "lucide-react";

const BLOOD_GROUPS: BloodGroup[] = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

export default function SearchPage() {
  const [bg, setBg] = useState<BloodGroup | undefined>();
  const [city, setCity] = useState<string>("");
  const [pincode, setPincode] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const data = await Api.donors.search({ bloodGroup: bg, city: city || undefined, pincode: pincode || undefined });
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-6">Find Donors</h1>
      <div className="grid gap-3 md:grid-cols-5">
        <Select onValueChange={(v)=>setBg(v as BloodGroup)}>
          <SelectTrigger className="md:col-span-1"><SelectValue placeholder="Blood Group" /></SelectTrigger>
          <SelectContent>
            {BLOOD_GROUPS.map((g)=> <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={setCity}>
          <SelectTrigger className="md:col-span-2"><SelectValue placeholder="City (Tamil Nadu)" /></SelectTrigger>
          <SelectContent>
            {TAMIL_NADU_CITIES.map((c)=> <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Pincode" value={pincode} onChange={(e)=>setPincode(e.target.value)} className="md:col-span-1" />
        <Button onClick={submit} className="md:col-span-1"><Search className="mr-2" /> {loading?"Searching...":"Search"}</Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {results.map((d: any) => (
          <div key={d.id} className="rounded-lg border p-4 bg-card">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{d.name} <span className="text-primary">{d.bloodGroup}</span></div>
                <div className="text-xs text-muted-foreground">{d.city} • {d.pincode}</div>
              </div>
              <div className="text-sm text-muted-foreground">Age {d.age} • {d.gender}</div>
            </div>
            <div className="mt-2 text-sm">Mobile: <span className="font-medium">{d.mobile}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
