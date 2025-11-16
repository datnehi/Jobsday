import { response } from 'express';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexChart,
  ApexStroke,
  ApexXAxis,
  ApexTooltip,
  ApexGrid,
  ApexPlotOptions,
  ApexDataLabels,
  ApexYAxis
} from 'ng-apexcharts';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AnalyticsService } from '../../../../services/analytics.service';
import { CompanyMember } from '../../../../models/company_member';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { HrStatsDto } from '../../../../dto/analytics';
import { LoadingComponent } from "../../../common/loading/loading.component";
import { finalize } from 'rxjs';

@Component({
  selector: 'app-analytics-hr',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, MatButtonToggleModule, LoadingComponent],
  templateUrl: './analytics-hr.component.html',
  styleUrls: ['./analytics-hr.component.css']
})
export class AnalyticsHrComponent implements OnInit {
  stats: HrStatsDto | null = null;
  member: CompanyMember | null = null;
  range = 30;
  growthSeries: { name: string; data: number[] }[] = [];
  topJobsSeries: { name?: string; data: number[] }[] = [];
  topHrSeries: { name?: string; data: number[] }[] = [];
  growthChart: ApexChart = {} as ApexChart;
  growthStroke: ApexStroke = {} as ApexStroke;
  growthXAxis: ApexXAxis = {} as ApexXAxis;
  growthColors: any[] = [];
  growthTooltip: ApexTooltip = {} as ApexTooltip;
  growthGrid: ApexGrid = {} as ApexGrid;

  topJobsChart: ApexChart = {} as ApexChart;
  topJobsPlotOptions: ApexPlotOptions = {} as ApexPlotOptions;
  topJobsDataLabels: ApexDataLabels = {} as ApexDataLabels;
  topJobsXAxis: ApexXAxis = {} as ApexXAxis;
  topJobsColors: any[] = [];
  topJobsGrid: ApexGrid = {} as ApexGrid;
  topJobsYAxis: ApexYAxis = {} as ApexYAxis;
  topJobsTooltip: ApexTooltip = {} as ApexTooltip;

  topHrYAxis: ApexYAxis = {} as ApexYAxis;
  topHrTooltip: ApexTooltip = {} as ApexTooltip;
  topHrChart: ApexChart = {} as ApexChart;
  topHrPlotOptions: ApexPlotOptions = {} as ApexPlotOptions;
  topHrDataLabels: ApexDataLabels = {} as ApexDataLabels;
  topHrXAxis: ApexXAxis = {} as ApexXAxis;
  topHrColors: any[] = [];
  topHrGrid: ApexGrid = {} as ApexGrid;

  isLoading = false;

  constructor(private analyticsService: AnalyticsService, private companyMemberService: CompanyMemberService) {}

  ngOnInit(): void {
    this.companyMemberService.getMe().subscribe((response) => {
      this.member = response.data;
      this.loadStats(this.range);
    });
  }

  setRange(value: number | string) {
    this.range = +value;
    this.loadStats(this.range);
  }

  private async loadStats(range: number = 30) {
    this.isLoading = true;
    this.analyticsService.getAnalyticsHr(range, this.member?.companyId || 0)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe((response) => {
        this.stats = response.data;
        this.prepareCharts();
      });
  }

  private buildYAxisAndTooltip(labels: string[], maxLabel = 10) {
    const yaxis: ApexYAxis = {
      labels: {
        formatter: (val: any, opts?: any) => {
          const idx = opts?.dataPointIndex ?? 0;
          const full = labels[idx] ?? String(val);
          return full.length > maxLabel ? full.slice(0, maxLabel) + '...' : full;
        },
        style: { fontSize: '13px' }
      }
    } as ApexYAxis;

    const tooltip: ApexTooltip = {
      y: {
        formatter: (value: any, opts?: any) => {
          const idx = opts?.dataPointIndex ?? 0;
          const title = labels[idx] ?? '';
          return `${title}: ${value}`;
        }
      },
      shared: false
    } as ApexTooltip;

    return { yaxis, tooltip };
  }

  private prepareCharts() {
    const s = this.stats;

    this.growthSeries = [{ name: 'Ứng viên mới', data: s?.growth.map(g => g.count) || [] }];
    this.growthChart = { type: 'line', height: 320, toolbar: { show: false } } as ApexChart;
    this.growthStroke = { curve: 'smooth' } as ApexStroke;
    this.growthXAxis = { categories: s?.growth.map(g => g.day) || [] } as ApexXAxis;
    this.growthColors = ['#487de7'];
    this.growthTooltip = { x: { format: 'dd/MM/yyyy' } } as ApexTooltip;
    this.growthGrid = { borderColor: '#ececec' } as ApexGrid;

    const topJobsLabels = s?.topJobs.map((j: any) => j.title) || [];
    const topJobsData = s?.topJobs.map((j: any) => j.applications) || [];
    this.topJobsSeries = [{ name: 'Số ứng tuyển', data: topJobsData }];
    this.topJobsChart = { type: 'bar', height: 360, toolbar: { show: false } } as ApexChart;
    this.topJobsPlotOptions = { bar: { horizontal: true, barHeight: '60%' } } as ApexPlotOptions;
    this.topJobsDataLabels = { enabled: false } as ApexDataLabels;
    this.topJobsXAxis = { categories: topJobsLabels } as ApexXAxis;
    this.topJobsColors = ['#4b369d'];
    this.topJobsGrid = { borderColor: '#ececec' } as ApexGrid;
    const jobsUi = this.buildYAxisAndTooltip(topJobsLabels, 10);
    this.topJobsYAxis = jobsUi.yaxis;
    this.topJobsTooltip = jobsUi.tooltip;

    const topHrLabels = s?.topHr.map((h: any) => h.label) || [];
    const topHrData = s?.topHr.map((h: any) => h.total) || [];
    this.topHrSeries = [{ name: 'CV phù hợp', data: topHrData }];
    this.topHrChart = { type: 'bar', height: 360, toolbar: { show: false } } as ApexChart;
    this.topHrPlotOptions = { bar: { horizontal: true, barHeight: '60%' } } as ApexPlotOptions;
    this.topHrDataLabels = { enabled: false } as ApexDataLabels;
    this.topHrXAxis = { categories: topHrLabels } as ApexXAxis;
    this.topHrColors = ['#70369d'];
    this.topHrGrid = { borderColor: '#ececec' } as ApexGrid;
    const hrUi = this.buildYAxisAndTooltip(topHrLabels, 10);
    this.topHrYAxis = hrUi.yaxis;
    this.topHrTooltip = hrUi.tooltip;
  }
}
