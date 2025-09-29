export type UserRole = 'CANDIDATE' | 'HR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  dob?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
  ntdSearch: boolean;
}

