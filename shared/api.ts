/**
 * Shared types between client and server for SEVAGAN
 */

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "Other";

export type Gender = "male" | "female" | "other";
export type AccountType = "individual" | "hospital" | "ngo";

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  mobile?: string; // required for individuals
  email?: string; // required for hospitals/NGOs
  createdAt: number;
  verifiedAt?: number;
}

export interface Donor {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  bloodGroup: BloodGroup;
  city: string;
  pincode: string;
  mobile: string;
  createdAt: number;
  accountId?: string; // optional link to account
}

export interface DonorCreateInput extends Omit<Donor, "id" | "createdAt"> {}

export interface DonorSearchQuery {
  bloodGroup?: BloodGroup;
  city?: string;
  pincode?: string;
}

export interface DonorSearchResponse {
  results: Donor[];
  total: number;
}

export interface BloodNeedRequest {
  id: string;
  bloodGroup: BloodGroup;
  city: string;
  pincode: string;
  neededAtISO: string; // ISO timestamp when blood is needed
  notes?: string;
  requesterAccountId?: string;
  requesterName?: string;
  createdAt: number;
}

export interface BloodNeedCreateInput
  extends Omit<BloodNeedRequest, "id" | "createdAt"> {}

export interface AuthOTPRequestBody {
  accountType: AccountType;
  mobile?: string; // for individuals
  email?: string; // for hospital/ngo
  profile?: {
    name?: string;
    mobile?: string;
    email?: string;
    bloodGroup?: BloodGroup;
    gender?: Gender;
    dob?: string;
    city?: string;
    pincode?: string;
  };
}

export interface AuthOTPVerifyBody {
  accountType: AccountType;
  mobile?: string;
  email?: string;
  otp: string;
}

export interface AuthOTPRequestResponse {
  requestId: string;
  channel: "sms" | "email";
}

export interface AuthOTPVerifyResponse {
  token: string; // session token (dev only)
  account: Account;
}

export interface DemoResponse {
  message: string;
}

export const TAMIL_NADU_CITIES: string[] = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Tiruchirappalli",
  "Salem",
  "Tirunelveli",
  "Tiruppur",
  "Erode",
  "Vellore",
  "Thoothukudi",
  "Dindigul",
  "Thanjavur",
  "Ranipet",
  "Kanchipuram",
  "Karur",
  "Cuddalore",
  "Kumbakonam",
  "Nagercoil",
  "Sivakasi",
  "Hosur",
  "Ambur",
  "Pudukkottai",
  "Nagapattinam",
  "Tiruvannamalai",
  "Namakkal",
  "Virudhunagar",
  "Perambalur",
  "Ariyalur",
  "Krishnagiri",
  "Ramanathapuram",
];
