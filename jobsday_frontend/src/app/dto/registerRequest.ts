export interface RegisterRequest {
  role: string;
  fullName: string;
  email: string;
  phone?: string;
  dob?: string;
  password: string;
  companyCode?: string;
  companyName?: string;
  companyAddress?: string;
  companyWebsite?: string;
  companyTaxCode?: string;
  companyDetail?: string;
  avatarUrl?: string;
}
