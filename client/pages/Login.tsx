import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Api } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await Api.auth.requestOtp({
        accountType: "individual",
        mobile,
      });
      const channels = (resp as any)?.channels || [];
      if (channels.includes("sms") && channels.includes("email")) {
        toast.success("OTP sent to your registered mobile and email");
      } else if (channels.includes("email")) {
        toast.success("OTP sent to your registered email");
      } else if (channels.includes("sms")) {
        toast.success("OTP sent to your mobile");
      } else {
        toast.success("OTP requested");
      }

      if ((resp as any)?.devCode) {
        console.log("DEV OTP:", (resp as any).devCode);
        toast.success(`Dev OTP: ${(resp as any).devCode}`);
      }
      setShowOtp(true);
    } catch (e) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setOtpLoading(true);
    try {
      const res = await Api.auth.verifyOtp({
        accountType: "individual",
        mobile,
        otp,
      });
      localStorage.setItem("sevagan_token", res.token);
      toast.success("Logged in");
      window.location.href = "/profile";
    } catch (e: any) {
      toast.error(e?.message || "OTP verify failed");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <Input
          placeholder="Mobile number"
          inputMode="numeric"
          maxLength={10}
          value={mobile}
          onChange={(e) =>
            setMobile(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
          }
          required
        />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </Button>
          <a href="/signup" className="text-sm text-red-600 font-semibold">
            New user? Sign up
          </a>
        </div>
      </form>

      {showOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm bg-card border rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-center mb-2">
              Enter OTP
            </h3>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Enter the 6-digit OTP sent to your mobile.
            </p>
            <div className="space-y-3">
              <Input
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                }
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={verify}
                  disabled={otpLoading}
                >
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowOtp(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
