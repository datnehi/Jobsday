import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConvertEnumService {
  public mapWorkTypeToEnum(workType: string): string | undefined {
    switch (workType) {
      case 'In Office': return 'IN_OFFICE';
      case 'Hybrid': return 'HYBRID';
      case 'Remote': return 'REMOTE';
      default: return undefined;
    }
  }

  public mapLevelToEnum(level: string): string | undefined {
    switch (level) {
      case 'Fresher': return 'FRESHER';
      case 'Intern': return 'INTERN';
      case 'Junior': return 'JUNIOR';
      case 'Senior': return 'SENIOR';
      default: return undefined;
    }
  }

  public mapContractTypeToEnum(contractType: string): string | undefined {
    switch (contractType) {
      case 'Full-time': return 'FULL_TIME';
      case 'Part-time': return 'PART_TIME';
      case 'Freelance': return 'FREELANCE';
      default: return undefined;
    }
  }

  public mapLocationToEnum(location: string): string | undefined {
    switch (location) {
      case 'Hà Nội': return 'HANOI';
      case 'Hồ Chí Minh': return 'HOCHIMINH';
      case 'Đà Nẵng': return 'DANANG';
      default: return undefined;
    }
  }

  public mapSalaryToEnum(salary: string): string | undefined {
    switch (salary) {
      case 'Dưới 10 triệu': return 'DUOI_10_TRIEU';
      case '10 - 15 triệu': return 'TU_10_DEN_15_TRIEU';
      case '15 - 20 triệu': return 'TU_15_DEN_20_TRIEU';
      case '20 - 25 triệu': return 'TU_20_DEN_25_TRIEU';
      case '25 - 30 triệu': return 'TU_25_DEN_30_TRIEU';
      case '30 - 50 triệu': return 'TU_30_DEN_50_TRIEU';
      case 'Trên 50 triệu': return 'TREN_50_TRIEU';
      case 'Thỏa thuận': return 'THOA_THUAN';
      default: return undefined;
    }
  }

  public mapExperienceToEnum(experience: string): string | undefined {
    switch (experience) {
      case 'Không yêu cầu': return 'KHONG_YEU_CAU';
      case 'Dưới 1 năm': return 'DUOI_1_NAM';
      case '1 năm': return 'MOT_NAM';
      case '2 năm': return 'HAI_NAM';
      case '3 năm': return 'BA_NAM';
      case '4 năm': return 'BON_NAM';
      case '5 năm': return 'NAM_NAM';
      case 'Trên 5 năm': return 'TREN_5_NAM';
      default: return undefined;
    }
  }

  public mapWorkTypeFromEnum(workType: string): string {
    switch (workType) {
      case 'IN_OFFICE': return 'In Office';
      case 'HYBRID': return 'Hybrid';
      case 'REMOTE': return 'Remote';
      default: return workType;
    }
  }

  public mapLevelFromEnum(level: string): string {
    switch (level) {
      case 'FRESHER': return 'Fresher';
      case 'INTERN': return 'Intern';
      case 'JUNIOR': return 'Junior';
      case 'SENIOR': return 'Senior';
      default: return level;
    }
  }

  public mapContractTypeFromEnum(contractType: string): string {
    switch (contractType) {
      case 'FULL_TIME': return 'Full-time';
      case 'PART_TIME': return 'Part-time';
      case 'FREELANCE': return 'Freelance';
      default: return contractType;
    }
  }

  public mapLocationFromEnum(location: string): string {
    switch (location) {
      case 'HANOI': return 'Hà Nội';
      case 'HOCHIMINH': return 'Hồ Chí Minh';
      case 'DANANG': return 'Đà Nẵng';
      default: return location;
    }
  }

  public mapSalaryFromEnum(salary: string): string {
    switch (salary) {
      case 'DUOI_10_TRIEU': return 'Dưới 10 triệu';
      case 'TU_10_DEN_15_TRIEU': return '10 - 15 triệu';
      case 'TU_15_DEN_20_TRIEU': return '15 - 20 triệu';
      case 'TU_20_DEN_25_TRIEU': return '20 - 25 triệu';
      case 'TU_25_DEN_30_TRIEU': return '25 - 30 triệu';
      case 'TU_30_DEN_50_TRIEU': return '30 - 50 triệu';
      case 'TREN_50_TRIEU': return 'Trên 50 triệu';
      case 'THOA_THUAN': return 'Thỏa thuận';
      default: return salary;
    }
  }

  public mapExperienceFromEnum(experience: string): string {
    switch (experience) {
      case 'KHONG_YEU_CAU': return 'Không yêu cầu';
      case 'DUOI_1_NAM': return 'Dưới 1 năm';
      case 'MOT_NAM': return '1 năm';
      case 'HAI_NAM': return '2 năm';
      case 'BA_NAM': return '3 năm';
      case 'BON_NAM': return '4 năm';
      case 'NAM_NAM': return '5 năm';
      case 'TREN_5_NAM': return 'Trên 5 năm';
      default: return experience;
    }
  }
}
