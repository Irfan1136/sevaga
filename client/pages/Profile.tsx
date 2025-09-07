import { useEffect, useState } from "react";
import { Api } from "@/lib/api";

export default function Profile() {
  const [account, setAccount] = useState<any | null>(null);
  const [donor, setDonor] = useState<any | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("sevagan_token");
        const res = await fetch("/api/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Not authorized");
        const data = await res.json();
        setAccount(data.account);
        setDonor(data.donor || null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMe();
  }, []);

  if (!account)
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        <p className="text-muted-foreground">
          Please login to view your profile.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="rounded-lg border bg-card p-6">
        <div className="grid gap-2">
          <div>
            <strong>Name:</strong> {account.name}
          </div>
          <div>
            <strong>Account:</strong> {account.type}
          </div>
          <div>
            <strong>Email:</strong> {account.email || "—"}
          </div>
          <div>
            <strong>Mobile:</strong> {account.mobile || "—"}
          </div>
          <div>
            <strong>Verified At:</strong>{" "}
            {new Date(account.verifiedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {donor && (
        <div className="mt-6 rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-2">Donor Details</h2>
          <div className="grid gap-2">
            <div>
              <strong>Blood Group:</strong> {donor.bloodGroup}
            </div>
            <div>
              <strong>City:</strong> {donor.city}
            </div>
            <div>
              <strong>Pincode:</strong> {donor.pincode}
            </div>
            <div>
              <strong>Mobile:</strong> {donor.mobile}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
