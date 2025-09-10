import React from "react";

import DecorativeSVG from "@/components/sevagan/DecorativeSVG";
import { toast } from "sonner";

type State = {
  account: any | null;
  donor: any | null;
  loading: boolean;
  editingName: boolean;
  nameInput: string;
  avatar: string | null;
  saving: boolean;
  editMobile: boolean;
  mobileInput: string;
  editEmail: boolean;
  emailInput: string;
};

export default class Profile extends React.Component<{}, State> {
  state: State = {
    account: null,
    donor: null,
    loading: true,
    editingName: false,
    nameInput: "",
    avatar: null,
    saving: false,
    editMobile: false,
    mobileInput: "",
    editEmail: false,
    emailInput: "",
  };

  componentDidMount() {
    try {
      const qp = new URLSearchParams(window.location.search);
      const t = qp.get("token");
      if (t) {
        localStorage.setItem("sevagan_token", t);
      }
    } catch {}
    this.fetchMe();
  }

  async fetchMe() {
    try {
      const token = localStorage.getItem("sevagan_token");
      const res = await fetch(
        new URL("/api/me", window.location.href).toString(),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!res.ok) {
        if (res.status === 401) {
          try {
            localStorage.removeItem("sevagan_token");
          } catch {}
          // If we have a pending signup stored locally, show it immediately
          try {
            const pending = localStorage.getItem("sevagan_signup_pending");
            if (pending) {
              const p = JSON.parse(pending || "{}");
              // Build a temporary account object from pending signup so profile shows full details
              const acct: any = {
                id: "pending",
                type: p.type || "individual",
                name: (p.name || p.mobile || p.email || "").toUpperCase(),
                mobile: p.mobile,
                email: p.email,
                avatarBase64: p.avatarBase64 || null,
              };

              // Build donor-like object when signup contained donor/profile fields
              let donor: any = null;
              const hasDonorFields = p && (p.bloodGroup || p.city || p.pincode || p.gender || p.dob || p.mobile);
              if (hasDonorFields) {
                const age = p.dob ? Math.max(0, new Date().getFullYear() - new Date(p.dob).getFullYear()) : undefined;
                donor = {
                  id: "pending-donor",
                  name: (p.name || "").toUpperCase(),
                  age,
                  gender: p.gender || undefined,
                  bloodGroup: p.bloodGroup || undefined,
                  city: p.city ? String(p.city).toUpperCase() : undefined,
                  pincode: p.pincode || undefined,
                  mobile: p.mobile || undefined,
                  accountId: acct.id,
                };
              }

              this.setState({ account: acct, donor, loading: false });
              return;
            }
          } catch (err) {
            console.warn("Failed to parse pending signup", err);
          }

          console.warn("Not authorized — redirecting to login");
          this.setState({ account: null, donor: null, loading: false });
          return;
        }
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to fetch /api/me (${res.status})`);
      }
      const data = await res.json();
      // normalize name to uppercase for display/editing
      const acct = data.account
        ? { ...data.account, name: (data.account.name || "").toUpperCase() }
        : data.account;
      this.setState(
        { account: acct, donor: data.donor || null, loading: false },
        () => {
          if (acct) {
            this.setState({
              nameInput: acct.name || "",
              avatar: acct.avatarBase64 || null,
              mobileInput: acct.mobile || "",
              emailInput: acct.email || "",
            });
          }
        },
      );
    } catch (err) {
      console.error(err);
      this.setState({ loading: false });
    }
  }

  componentDidUpdate(_prevProps: {}, prevState: State) {
    if (!this.state.loading && !this.state.account) {
      window.location.href = "/login";
    }
  }

  saveProfile = async (payload: any) => {
    this.setState({ saving: true });
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
      if (!res.ok) {
        if (res.status === 401) {
          try {
            localStorage.removeItem("sevagan_token");
          } catch {}
          console.warn("Not authorized when saving profile");
          toast.error("Not authorized");
          this.setState({ saving: false });
          return;
        }
        const txt = await res.text().catch(() => "Failed");
        toast.error(txt || "Failed to save profile");
        throw new Error(txt || "Failed to save profile");
      }
      const data = await res.json();
      if (data.account) {
        this.setState({ account: data.account } as any);
        if (data.account.avatarBase64)
          this.setState({ avatar: data.account.avatarBase64 } as any);
        toast.success("Profile updated");
      }
      if (data.donor) {
        this.setState({ donor: data.donor } as any);
      }
    } catch (err: any) {
      console.error(err);
      if (!err?.message) toast.error("Failed to save profile");
    } finally {
      this.setState({
        saving: false,
        editingName: false,
        editMobile: false,
        editEmail: false,
      } as any);
    }
  };

  onAvatarChange = (file: File | null) => {
    if (!file) return;
    // limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const b64 = String(reader.result || "");
        this.setState({ avatar: b64 } as any);
        await this.saveProfile({ avatarBase64: b64 });
      } catch (err) {
        console.error("Failed to process avatar", err);
        toast.error("Failed to upload image");
      }
    };
    reader.onerror = (e) => {
      console.error("FileReader error", e);
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  render() {
    const s = this.state;
    if (s.loading) {
      return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 relative">
          <DecorativeSVG className="absolute left-4 top-4 opacity-30" />
          <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
          <p className="text-muted-foreground">Loading profile…</p>
        </div>
      );
    }

    if (!s.account) {
      return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 relative">
          <DecorativeSVG className="absolute left-4 top-4 opacity-30" />
          <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
          <div role="alert" className="rounded border bg-card p-6">
            <p className="mb-4">
              You are not logged in. Please log in to view and edit your
              profile.
            </p>
            <div className="flex gap-2">
              <a
                href="/login"
                className="px-3 py-1 bg-primary text-white rounded"
              >
                Login
              </a>
              <a href="/" className="px-3 py-1 border rounded">
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 relative">
        <DecorativeSVG className="absolute left-4 top-4 opacity-30" />
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

        <div className="rounded-lg border bg-card p-6 flex items-center gap-6">
          <div className="flex-shrink-0">
            {s.avatar ? (
              <img
                src={s.avatar}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                {s.account.name
                  ? s.account.name.trim().charAt(0).toUpperCase()
                  : "U"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {s.editingName ? (
                <>
                  <input
                    className="border rounded px-2 py-1"
                    value={s.nameInput}
                    onChange={(e) =>
                      this.setState({
                        nameInput: e.target.value.toUpperCase(),
                      } as any)
                    }
                  />
                  <button
                    className="px-3 py-1 bg-primary text-white rounded"
                    onClick={() =>
                      this.saveProfile({ name: s.nameInput.toUpperCase() })
                    }
                    disabled={s.saving}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() =>
                      this.setState({
                        editingName: false,
                        nameInput: s.account.name,
                      } as any)
                    }
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {/* display name: prefer account.name, then donor.name, then mobile */}
                  <div className="text-lg font-semibold">
                    {(
                      (s.account && s.account.name) ||
                      (s.donor && s.donor.name) ||
                      s.account?.mobile ||
                      s.donor?.mobile ||
                      ""
                    )
                      .toString()
                      .toUpperCase()}
                  </div>
                  <button
                    className="text-sm text-muted-foreground ml-2"
                    onClick={() => this.setState({ editingName: true } as any)}
                  >
                    ✎ Edit
                  </button>
                </>
              )}
            </div>

            {/* show minimal donor info below name */}

            <div className="mt-3 text-sm text-muted-foreground">
              {s.donor ? (
                <div className="flex flex-col gap-1">
                  <div>
                    <strong>Blood Group:</strong> {s.donor.bloodGroup || "—"}
                  </div>
                  <div>
                    <strong>City:</strong> {s.donor.city || "—"}
                  </div>
                  <div>
                    <strong>Mobile:</strong>{" "}
                    {s.donor.mobile || s.account?.mobile || "—"}
                  </div>
                </div>
              ) : (
                <div>
                  <strong>Mobile:</strong> {s.account?.mobile || "—"}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    this.onAvatarChange(
                      e.target.files ? e.target.files[0] : null,
                    )
                  }
                />
                <span className="text-sm text-muted-foreground">
                  Upload/Change photo (optional)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
