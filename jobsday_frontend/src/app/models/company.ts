export interface Company {
  id: number;
  name: string;
  logo?: string;
  location: string;
  address: string;
  website?: string;
  taxCode: string;
  email: string;
  description?: string;
  status?: CompanyStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CompanyStatus = 'PENDING' | 'APPROVED' | 'INACTIVE' | 'REJECTED';
