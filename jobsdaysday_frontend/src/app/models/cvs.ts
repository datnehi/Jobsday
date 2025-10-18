export interface Cvs {
  id: number;
  user_id: number;
  title: string;
  file_url: string;
  address?: string;
  level?: string;        // Giá trị của level_enum
  experience?: string;   // Giá trị của experience_enum
  job_title?: string;
  content?: string;
  is_public: boolean;
  created_at: string;    // ISO date string
  updated_at: string;    // ISO date string
}
