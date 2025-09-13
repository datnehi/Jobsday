export type JobStatus = 'ACTIVE' | 'HIDDEN' | 'CLOSED';
export type Location = 'HANOI' | 'DANANG' | 'HOCHIMINH';
export type JobType = 'IN_OFFICE' | 'HYBRID' | 'REMOTE';
export type Level = 'FRESHER' | 'INTERN' | 'JUNIOR' | 'SENIOR';
export type ContractType = 'FULL_TIME' | 'PART_TIME' | 'FREELANCE';
export type Salary =
  | 'DUOI_10_TRIEU'
  | 'TU_10_DEN_15_TRIEU'
  | 'TU_15_DEN_20_TRIEU'
  | 'TU_20_DEN_25_TRIEU'
  | 'TU_25_DEN_30_TRIEU'
  | 'TU_30_DEN_50_TRIEU'
  | 'TREN_50_TRIEU'
  | 'THOA_THUAN';
export type Experience =
  | 'KHONG_YEU_CAU'
  | 'DUOI_1_NAM'
  | 'MOT_NAM'
  | 'HAI_NAM'
  | 'BA_NAM'
  | 'BON_NAM'
  | 'NAM_NAM'
  | 'TREN_5_NAM';

export interface Job {
  id: number;
  companyId: number;
  title: string;
  description: string;
  requirement: string;
  benefit: string;
  workingTime: string;
  location: Location;
  address: string;
  jobType: JobType;
  level: Level;
  contractType: ContractType;
  salary: Salary;
  experience: Experience;
  quantity: number;
  deadline: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}
