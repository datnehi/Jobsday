import { UserRole } from "../models/user";

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dob?: string;
  avatarUrl: string;
  role: UserRole;
}

