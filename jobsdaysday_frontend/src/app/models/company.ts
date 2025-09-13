export interface Company {
  id: number;
  name: string;
  logo?: string;
  address: string;
  website: string;
  taxCode: string;
  detail: string;
  status?: CompanyStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
