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

  searchForm = this.fb.group({
    keyword: [''],
    location: [''],
    salary: [''],
    type: ['']
  });

  jobs: any[] = [];

  onSearch() {
    // const params = this.searchForm.value;
    // this.http.get<any[]>('http://localhost:8080/api/jobs', { params })
    //   .subscribe(res => this.jobs = res);
  }
}

