import { useState } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Api } from "@/lib/api";
import {
  AccountType,
  TAMIL_NADU_CITIES,
  BloodGroup,
  Gender,
} from "@shared/api";
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

export default function Signup() {
  const [type, setType] = useState<AccountType>("individual");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | undefined>(
    undefined,
  );
  const [gender, setGender] = useState<Gender>("male");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = "Name is required";
    if (type === "individual") {
      if (!/^[0-9]{10}$/.test(mobile)) err.mobile = "Mobile must be 10 digits";
      if (!bloodGroup) err.bloodGroup = "Select your blood group";
      if (!/^[0-9]{6}$/.test(pincode)) err.pincode = "Pincode must be 6 digits";
      if (!city) err.city = "Select a city";
      if (!dob) err.dob = "Date of birth required";
    } else {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        err.email = "Valid email required";
      if (!/^[0-9]{6}$/.test(pincode)) err.pincode = "Pincode must be 6 digits";
      if (!city) err.city = "Select a city";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const resp = await Api.auth.requestOtp({
        accountType: type,
        mobile: type === "individual" ? mobile : undefined,
        email: type !== "individual" ? email : undefined,
        profile: {
          name,
          mobile,
          email,
          bloodGroup,
          gender,
          dob,
          city,
          pincode,
        },
      });
      // store pending signup locally so we can complete after OTP verification
      localStorage.setItem(
        "sevagan_signup_pending",
        JSON.stringify({
          type,
          name,
          mobile,
          email,
          bloodGroup,
          gender,
          dob,
          city,
          pincode,
        }),
      );
      toast.success(
        "Verification requested. Please enter OTP to complete signup.",
      );
      // if dev code returned, show it in console (the server also logs it)
      if ((resp as any)?.devCode) {
        console.log("DEV OTP:", (resp as any).devCode);
        toast.success(`Dev OTP: ${(resp as any).devCode}`);
      }
      setShowOtpModal(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to request verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-background py-8 px-4">
      <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-md">
        <h1 className="text-2xl font-extrabold text-center text-primary mb-2">
          Create your SEVAGAN account
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Quick sign up — mobile verification for individuals, email for
          NGOs/Hospitals
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Select onValueChange={(v) => setType(v as AccountType)}>
            <SelectTrigger>
              <SelectValue placeholder="Account Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="ngo">NGO</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Full name / Organization"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <div className="text-red-600 text-sm">{errors.name}</div>
          )}

          {type === "individual" ? (
            <>
              <div>
                <Label className="text-sm mb-2">Gender</Label>
                <RadioGroup
                  className="flex gap-3"
                  value={gender}
                  onValueChange={(v) => setGender(v as Gender)}
                >
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="male" id="rg-m" />
                    <span>Male</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="female" id="rg-f" />
                    <span>Female</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="other" id="rg-o" />
                    <span>Other</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="DOB"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                <Input
                  placeholder="Mobile (10 digits)"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                    )
                  }
                />
              </div>
              {errors.dob && (
                <div className="text-red-600 text-sm">{errors.dob}</div>
              )}
              {errors.mobile && (
                <div className="text-red-600 text-sm">{errors.mobile}</div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Select onValueChange={setBloodGroup as any}>
                  <SelectTrigger>
                    <SelectValue placeholder="Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((g) => (
                      <SelectItem value={g} key={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="City (Tamil Nadu)" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAMIL_NADU_CITIES.map((c) => (
                      <SelectItem value={c} key={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.bloodGroup && (
                <div className="text-red-600 text-sm">{errors.bloodGroup}</div>
              )}
              {errors.city && (
                <div className="text-red-600 text-sm">{errors.city}</div>
              )}

              <Input
                placeholder="Pincode (6 digits)"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) =>
                  setPincode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                }
              />
              {errors.pincode && (
                <div className="text-red-600 text-sm">{errors.pincode}</div>
              )}
            </>
          ) : (
            <>
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <div className="text-red-600 text-sm">{errors.email}</div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Select onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="City (Tamil Nadu)" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAMIL_NADU_CITIES.map((c) => (
                      <SelectItem value={c} key={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Pincode (6 digits)"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                    )
                  }
                />
              </div>
              {errors.city && (
                <div className="text-red-600 text-sm">{errors.city}</div>
              )}
              {errors.pincode && (
                <div className="text-red-600 text-sm">{errors.pincode}</div>
              )}
            </>
          )}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Requesting..." : "Request Verification"}
          </Button>
        </form>
      </div>
    </div>
  );
}
