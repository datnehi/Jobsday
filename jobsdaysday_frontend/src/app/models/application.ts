export type ApplicationStatus = 'APPLIED' | 'VIEWED' | 'SUITABLE' | 'UNSUITABLE';

export interface Application {
  id: number;
  job_id: number;
  candidate_id: number;
  file_name: string;
  cv_url: string;
  file_type: string;
  cover_letter?: string;
  status: ApplicationStatus;
  applied_at: string;   // ISO date string
  updated_at: string;   // ISO date string
}
