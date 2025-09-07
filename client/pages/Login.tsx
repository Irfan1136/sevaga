import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Api } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Api.auth.requestOtp({ accountType: "individual", mobile });
      toast.success("OTP sent to your mobile");
    } catch (e) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <Input placeholder="Mobile number" value={mobile} onChange={(e)=>setMobile(e.target.value)} required />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>{loading?"Sending...":"Send OTP"}</Button>
          <a href="/signup" className="text-sm text-muted-foreground">New user? Sign up</a>
        </div>
      </form>
    </div>
  );
}
