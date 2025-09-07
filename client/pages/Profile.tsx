import { useEffect, useState } from "react";
import { Api } from "@/lib/api";

import DecorativeSVG from "@/components/sevagan/DecorativeSVG";

export default function Profile() {
  const [account, setAccount] = useState<any | null>(null);
  const [donor, setDonor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If token provided via ?token=..., save to localStorage for preview screenshots
    try {
      const qp = new URLSearchParams(window.location.search);
      const t = qp.get("token");
      if (t) {
        localStorage.setItem("sevagan_token", t);
      }
    } catch {}

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
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    if (!loading && !account) {
      // redirect to login if not authenticated
      window.location.href = "/login";
    }
  }, [loading, account]);

  if (loading)
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        <p className="text-muted-foreground">Loading profile…</p>
      </div>
    );

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(account.name || "");
  const [avatar, setAvatar] = useState<string | null>(
    account.avatarBase64 || null,
  );
  const [saving, setSaving] = useState(false);
  const [editMobile, setEditMobile] = useState(false);
  const [mobileInput, setMobileInput] = useState(account.mobile || "");
  const [editEmail, setEditEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(account.email || "");

  const saveProfile = async (payload: any) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("sevagan_token");
      const res = await fetch("/api/me", {
        method: "POST",
        headers: Object.assign(
          { "Content-Type": "application/json" },
          token ? { Authorization: `Bearer ${token}` } : {},
        ),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAccount(data.account);
      if (data.account.avatarBase64) setAvatar(data.account.avatarBase64);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setEditingName(false);
      setEditMobile(false);
      setEditEmail(false);
    }
  };

  const onAvatarChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = String(reader.result || "");
      setAvatar(b64);
      await saveProfile({ avatarBase64: b64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      <div className="rounded-lg border bg-card p-6 flex items-center gap-6">
        <div className="flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
              {account.name ? account.name.trim().charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {editingName ? (
              <>
                <input
                  className="border rounded px-2 py-1"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
                <button
                  className="px-3 py-1 bg-primary text-white rounded"
                  onClick={() => saveProfile({ name: nameInput })}
                  disabled={saving}
                >
                  Save
                </button>
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => {
                    setEditingName(false);
                    setNameInput(account.name);
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold">{account.name}</div>
                <button
                  className="text-sm text-muted-foreground ml-2"
                  onClick={() => setEditingName(true)}
                >
                  ✎ Edit
                </button>
              </>
            )}
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            Account: {account.type}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              {editEmail ? (
                <div className="flex gap-2 mt-1">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <button
                    className="px-3 py-1 bg-primary text-white rounded"
                    onClick={() => saveProfile({ email: emailInput })}
                    disabled={saving}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => {
                      setEditEmail(false);
                      setEmailInput(account.email || "");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <div>{account.email || "—"}</div>
                  <button
                    className="text-sm text-muted-foreground"
                    onClick={() => setEditEmail(true)}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Mobile</div>
              {editMobile ? (
                <div className="flex gap-2 mt-1">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={mobileInput}
                    onChange={(e) =>
                      setMobileInput(
                        e.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                      )
                    }
                  />
                  <button
                    className="px-3 py-1 bg-primary text-white rounded"
                    onClick={() => saveProfile({ mobile: mobileInput })}
                    disabled={saving}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => {
                      setEditMobile(false);
                      setMobileInput(account.mobile || "");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <div>{account.mobile || "—"}</div>
                  <button
                    className="text-sm text-muted-foreground"
                    onClick={() => setEditMobile(true)}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  onAvatarChange(e.target.files ? e.target.files[0] : null)
                }
              />
              <span className="text-sm text-muted-foreground">
                Upload/Change photo (optional)
              </span>
            </label>
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
