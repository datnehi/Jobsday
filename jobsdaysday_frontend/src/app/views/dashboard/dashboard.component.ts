import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  selectedLocations: string[] = [];
  locations: string[] = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'];

  selectedLevels: string[] = [];
  levels: string[] = ['Fresher', 'Intern', 'Junior', 'Senior'];

  selectedJobTypes: string[] = [];
  jobTypes: string[] = ['Full-time', 'Part-time', 'Remote'];

  selectedContracts: string[] = [];
  contracts: string[] = ['Dài hạn', 'Ngắn hạn', 'Thời vụ'];

  toggleLocation(location: string) {
    if (this.selectedLocations.includes(location)) {
      this.selectedLocations = this.selectedLocations.filter(l => l !== location);
    } else {
      this.selectedLocations.push(location);
    }
  }

  toggleLevel(level: string) {
    if (this.selectedLevels.includes(level)) {
      this.selectedLevels = this.selectedLevels.filter(l => l !== level);
    } else {
      this.selectedLevels.push(level);
    }
  }

  toggleJobType(jobType: string) {
    if (this.selectedJobTypes.includes(jobType)) {
      this.selectedJobTypes = this.selectedJobTypes.filter(j => j !== jobType);
    } else {
      this.selectedJobTypes.push(jobType);
    }
  }

  toggleContract(contract: string) {
    if (this.selectedContracts.includes(contract)) {
      this.selectedContracts = this.selectedContracts.filter(c => c !== contract);
    } else {
      this.selectedContracts.push(contract);
    }
  }

  clearFilters() {
    this.selectedLocations = [];
    this.selectedLevels = [];
    this.selectedJobTypes = [];
    this.selectedContracts = [];
  }

}

