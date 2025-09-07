import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Api } from "@/lib/api";
import { AccountType, TAMIL_NADU_CITIES } from "@shared/api";
import { toast } from "sonner";

export default function Signup() {
  const [type, setType] = useState<AccountType>("individual");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Api.auth.requestOtp({ accountType: type, mobile: type === "individual" ? mobile : undefined, email: type !== "individual" ? email : undefined });
      toast.success("OTP/request sent");
    } catch (e) {
      toast.error("Failed to request verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
      <form onSubmit={submit} className="space-y-4">
        <Select onValueChange={(v)=>setType(v as AccountType)}>
          <SelectTrigger><SelectValue placeholder="Account Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="hospital">Hospital</SelectItem>
            <SelectItem value="ngo">NGO</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Name / Organization" value={name} onChange={(e)=>setName(e.target.value)} required />
        {type === "individual" ? (
          <Input placeholder="Mobile" value={mobile} onChange={(e)=>setMobile(e.target.value)} required />
        ) : (
          <Input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        )}
        <Button type="submit" disabled={loading}>{loading?"Processing...":"Request Verification"}</Button>
      </form>
    </div>
  );
}
