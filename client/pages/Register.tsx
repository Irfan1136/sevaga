import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Api } from "@/lib/api";
import { BloodGroup, Gender, TAMIL_NADU_CITIES } from "@shared/api";
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

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "male" as Gender,
    bloodGroup: undefined as BloodGroup | undefined,
    city: "",
    pincode: "",
    mobile: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodGroup || !form.city) return;
    setLoading(true);
    try {
      await Api.donors.create({
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        city: form.city,
        pincode: form.pincode,
        mobile: form.mobile,
      });
      toast.success("Thanks for registering as a donor!");
      setForm({
        name: "",
        age: "",
        gender: "male",
        bloodGroup: undefined,
        city: "",
        pincode: "",
        mobile: "",
      });
    } catch (e: any) {
      toast.error(typeof e === "string" ? e : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-6">Become a Donor</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Full Name"
            value={form.name}
            className="uppercase-input"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value.toUpperCase() })
            }
            required
          />
          <Input
            placeholder="Age"
            type="number"
            min={18}
            max={65}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="text-sm">Gender</Label>
          <RadioGroup
            className="mt-2 grid grid-cols-3 gap-2"
            value={form.gender}
            onValueChange={(v) => setForm({ ...form, gender: v as Gender })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="g-m" />
              <Label htmlFor="g-m">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="g-f" />
              <Label htmlFor="g-f">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="g-o" />
              <Label htmlFor="g-o">Other</Label>
            </div>
          </RadioGroup>
        </div>
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
          placeholder="Mobile Number"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Register as Donor"}
        </Button>
      </form>
    </div>
  );
}
