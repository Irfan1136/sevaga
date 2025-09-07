import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Api } from "@/lib/api";
import { toast } from "sonner";

export default function Verify() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pending = localStorage.getItem("sevagan_signup_pending");
    if (!pending) return toast.error("No pending signup found");
    const profile = JSON.parse(pending);
    setLoading(true);
    try {
      const resp = await Api.auth.verifyOtp({
        accountType: profile.type,
        mobile: profile.mobile,
        email: profile.email,
        otp,
      });
      // on success, create donor record for individuals
      if (profile.type === "individual") {
        await Api.donors.create({
          name: profile.name,
          age: profile.dob
            ? new Date().getFullYear() - new Date(profile.dob).getFullYear()
            : 0,
          gender: profile.gender,
          bloodGroup: profile.bloodGroup,
          city: profile.city,
          pincode: profile.pincode,
          mobile: profile.mobile,
        });
      }
      localStorage.removeItem("sevagan_signup_pending");
      toast.success("Account verified and created");
      window.location.href = "/profile";
    } catch (e: any) {
      toast.error(e?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 px-4">
      <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-md">
        <h1 className="text-2xl font-extrabold text-center text-primary mb-2">
          Enter OTP
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Enter the OTP sent to your mobile/email to verify your account.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Input
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
            }
            inputMode="numeric"
            maxLength={6}
          />
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>
      </div>
    </div>
  );
}
