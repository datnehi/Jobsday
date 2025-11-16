import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexStroke, ApexTooltip, ApexPlotOptions, ApexDataLabels } from 'ng-apexcharts';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { finalize, forkJoin } from 'rxjs';
import { DailyCount, TopCandidate, TopCompanyApplication, TopCompanyJob, TopJob, TopSkill } from '../../../../dto/analytics';
import { AnalyticsService } from '../../../../services/analytics.service';
import { LoadingComponent } from "../../../common/loading/loading.component";

type LineOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke?: ApexStroke;
  tooltip?: ApexTooltip;
};

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    MatCardModule,
    MatButtonToggleModule,
    MatTableModule,
    LoadingComponent
],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit {
  range = '30';
  totalApplications = 0;
  newToday = 0;
  funnelConversion = 0;
  newCompaniesToday = 0;
  newCandidatesToday = 0;
  activeJobsCount = 0;
  topJobs: TopJob[] = [];
  applications: DailyCount[] = [];
  lineChart!: LineOptions;
  barChart!: {
    series: ApexAxisChartSeries | any;
    chart?: ApexChart;
    xaxis?: ApexXAxis;
    plotOptions?: ApexPlotOptions | any;
    dataLabels?: ApexDataLabels | any;
  };
  jobsCreatedChart!: LineOptions;
  topJobsChart!: {
    series: ApexAxisChartSeries | any;
    chart?: ApexChart;
    xaxis?: ApexXAxis;
    plotOptions?: ApexPlotOptions | any;
    dataLabels?: ApexDataLabels | any;
  };
  topCompaniesJobsChart!: {
    series: ApexAxisChartSeries | any;
    chart?: ApexChart;
    xaxis?: ApexXAxis;
    plotOptions?: ApexPlotOptions | any;
    dataLabels?: ApexDataLabels | any;
  };
  topCompaniesApplicantsChart!: {
    series: ApexAxisChartSeries | any;
    chart?: ApexChart;
    xaxis?: ApexXAxis;
    plotOptions?: ApexPlotOptions | any;
    dataLabels?: ApexDataLabels | any;
  };
  topCandidatesChart!: {
    series: ApexAxisChartSeries | any;
    chart?: ApexChart;
    xaxis?: ApexXAxis;
    plotOptions?: ApexPlotOptions | any;
    dataLabels?: ApexDataLabels | any;
    labels?: string[];
  };
  isLoading = false;

  constructor(private analyticsService: AnalyticsService) { }

  ngOnInit(): void {
    this.initCharts();
    this.loadAllStats();
  }

  setRange(value: string | number) {
    this.range = '' + value;
    this.loadAllStats();
  }

  initCharts() {
    this.lineChart = {
      series: [{ name: 'Applications', data: [] }],
      chart: { height: 320, type: 'line', zoom: { enabled: false } },
      xaxis: { categories: [] },
      stroke: { curve: 'smooth' },
      tooltip: { enabled: true }
    };

    this.barChart = {
      series: [{ name: 'Applications', data: [] }],
      chart: { type: 'bar', height: 320 },
      xaxis: { categories: [] },
      plotOptions: { bar: { horizontal: false } },
      dataLabels: { enabled: false }
    };

    this.jobsCreatedChart = {
      series: [{ name: 'Jobs created', data: [] }],
      chart: { height: 320, type: 'line', zoom: { enabled: false } },
      xaxis: { categories: [] },
      stroke: { curve: 'smooth' },
      tooltip: { enabled: true }
    };

    this.topJobsChart = {
      series: [{ name: 'Applications', data: [] }],
      chart: { type: 'bar', height: 320 },
      xaxis: { categories: [], labels: { rotate: -45 } },
      plotOptions: { bar: { horizontal: false, columnWidth: '60%' } },
      dataLabels: { enabled: true }
    };

    this.topCompaniesJobsChart = {
      series: [{ name: 'Jobs', data: [] }],
      chart: { type: 'bar', height: 320 },
      xaxis: { categories: [], labels: { rotate: -45 } },
      plotOptions: { bar: { horizontal: false, columnWidth: '60%' } },
      dataLabels: { enabled: true }
    };

    this.topCompaniesApplicantsChart = {
      series: [{ name: 'Applicants', data: [] }],
      chart: { type: 'bar', height: 320 },
      xaxis: { categories: [], labels: { rotate: -45 } },
      plotOptions: { bar: { horizontal: false, columnWidth: '60%' } },
      dataLabels: { enabled: true }
    };

    this.topCandidatesChart = {
      series: [{ name: 'Applications', data: [] }],
      chart: { type: 'bar', height: 320 },
      xaxis: { categories: [] },
      plotOptions: { bar: { horizontal: false, columnWidth: '60%' } },
      dataLabels: { enabled: true },
      labels: []
    };
  }

  loadAllStats() {
    this.isLoading = true;
    const days = +this.range;
    forkJoin({
      overview: this.analyticsService.getOverview(days),
      analyticsDays: this.analyticsService.getAnalyticsDays(days)
    })
    .pipe(finalize(() => { this.isLoading = false}))
    .subscribe(({
      overview,
      analyticsDays
    }) => {
      const safeArray = <T>(input: any): T[] => Array.isArray(input) ? input : Array.isArray(input?.data) ? input.data : [];

      const overviewData = overview?.data ?? {};
      const analyticsDaysData = analyticsDays?.data;

      this.totalApplications = analyticsDaysData?.totalApplications ?? 0;
      this.newCompaniesToday = overviewData.newCompaniesToday ?? 0;
      this.newCandidatesToday = overviewData.newCandidatesToday ?? 0;
      this.activeJobsCount = overviewData.activeJobs ?? 0;
      this.newToday = overviewData.totalApplicationsNow ?? 0;
      this.funnelConversion = Math.round((analyticsDaysData?.responseRate / this.totalApplications) * 100);

      this.applications = analyticsDaysData?.applications ?? [];
      this.lineChart = {
        ...this.lineChart,
        series: [{ name: 'Applications', data: this.applications.map(a => a.count) }],
        xaxis: { categories: this.applications.map(a => a.day) }
      };

      this.topJobs = analyticsDaysData?.topJobs ?? [];
      this.topJobsChart = {
        ...this.topJobsChart,
        series: [{ name: 'Applications', data: this.topJobs.map(j => j.applications) }],
        xaxis: { categories: this.topJobs.map(j => j.title) }
      };

      const safeTopSkills = safeArray<TopSkill>(analyticsDaysData?.topSkills);
      this.barChart = {
        ...this.barChart,
        series: [{ name: 'Applications', data: safeTopSkills.map(l => l.applicationCount) }],
        xaxis: { categories: safeTopSkills.map(l => l.skillName ?? '') }
      };

      const safeTopCompaniesJob = safeArray<TopCompanyJob>(analyticsDaysData?.topCompaniesJobs);
      this.topCompaniesJobsChart = {
        ...this.topCompaniesJobsChart,
        series: [{ name: 'Jobs', data: safeTopCompaniesJob.map(c => c.jobs) }],
        xaxis: { categories: safeTopCompaniesJob.map(c => c.company) }
      };

      const safeTopCompaniesApplication = safeArray<TopCompanyApplication>(analyticsDaysData?.topCompaniesApplications);
      this.topCompaniesApplicantsChart = {
        ...this.topCompaniesApplicantsChart,
        series: [{ name: 'Applicants', data: safeTopCompaniesApplication.map(c => c.applications) }],
        xaxis: { categories: safeTopCompaniesApplication.map(c => c.company) }
      };

      const safeTopCandidates = safeArray<TopCandidate>(analyticsDaysData?.topCandidates);
      this.topCandidatesChart = {
        ...this.topCandidatesChart,
        series: [{ name: 'Applications', data: safeTopCandidates.map(c => c.applications) }],
        xaxis: { categories: safeTopCandidates.map(c => c.name) }
      };

      const safeJobsCreated = safeArray<DailyCount>(analyticsDaysData?.jobsCreated);
      this.jobsCreatedChart = {
        ...this.jobsCreatedChart,
        series: [{ name: 'Jobs Created', data: safeJobsCreated.map(j => j.count) }],
        xaxis: { categories: safeJobsCreated.map(j => j.day) }
      };
    });
  }


}
