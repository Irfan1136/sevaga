import type {
  BloodGroup,
  Donor,
  DonorCreateInput,
  DonorSearchQuery,
  DonorSearchResponse,
  BloodNeedCreateInput,
  BloodNeedRequest,
  AuthOTPRequestBody,
  AuthOTPRequestResponse,
  AuthOTPVerifyBody,
  AuthOTPVerifyResponse,
} from "@shared/api";

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const Api = {
  donors: {
    create: (input: DonorCreateInput) =>
      http<Donor>("/api/donors", { method: "POST", body: JSON.stringify(input) }),
    search: (q: DonorSearchQuery) =>
      http<DonorSearchResponse>(
        `/api/donors?${new URLSearchParams(q as Record<string, string>).toString()}`,
      ),
  },
  needs: {
    create: (input: BloodNeedCreateInput) =>
      http<BloodNeedRequest>("/api/needs", { method: "POST", body: JSON.stringify(input) }),
    streamUrl: "/api/needs/stream",
  },
  auth: {
    requestOtp: (body: AuthOTPRequestBody) =>
      http<AuthOTPRequestResponse>("/api/auth/request-otp", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    verifyOtp: (body: AuthOTPVerifyBody) =>
      http<AuthOTPVerifyResponse>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    me: () => http<{ account: any; donor?: any }>("/api/me"),
  },
};

export type { BloodGroup };
