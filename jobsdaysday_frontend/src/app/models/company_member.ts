import { User } from './user';

export type MemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CompanyMember {
  id?: number;
  companyId: number;
  userId: number;
  isAdmin: boolean;
  status: MemberStatus;
  createdAt?: string;
  updatedAt?: string;
}
