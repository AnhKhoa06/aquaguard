import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  analytics: any = null;
  loading = true;
  private apiUrl = environment.apiUrl;

  private userGrowthChart: Chart | null = null;
  private sosTrendChart: Chart | null = null;
  private roleChart: Chart | null = null;
  private urgencyChart: Chart | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.userGrowthChart?.destroy();
    this.sosTrendChart?.destroy();
    this.roleChart?.destroy();
    this.urgencyChart?.destroy();
  }

  loadAnalytics(): void {
    this.http.get<any>(`${this.apiUrl}/admin/analytics`).subscribe({
      next: (res) => {
        if (res.success) {
          this.analytics = res.data;
          setTimeout(() => this.renderCharts(), 100);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private renderCharts(): void {
    this.renderUserGrowthChart();
    // this.renderSosTrendChart();
    this.renderRoleChart();
    // this.renderUrgencyChart();
  }

  private renderUserGrowthChart(): void {
    const ctx = document.getElementById('userGrowthChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.userGrowthChart?.destroy();
    this.userGrowthChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.analytics.user_growth.map((d: any) =>
          new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        ),
        datasets: [
          {
            label: 'Người dùng mới',
            data: this.analytics.user_growth.map((d: any) => d.count),
            borderColor: '#00bcd4',
            backgroundColor: 'rgba(0,188,212,0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#00bcd4',
            pointRadius: 4,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8891a8', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8891a8', font: { size: 11 }, stepSize: 1 },
            beginAtZero: true,
          },
        },
      },
    });
  }

  // private renderSosTrendChart(): void {
  //   const ctx = document.getElementById('sosTrendChart') as HTMLCanvasElement;
  //   if (!ctx) return;
  //   this.sosTrendChart?.destroy();
  //   this.sosTrendChart = new Chart(ctx, {
  //     type: 'bar',
  //     data: {
  //       labels: this.analytics.sos_trend.map((d: any) =>
  //         new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  //       ),
  //       datasets: [
  //         {
  //           label: 'SOS',
  //           data: this.analytics.sos_trend.map((d: any) => d.count),
  //           backgroundColor: 'rgba(239,68,68,0.7)',
  //           borderColor: '#ef4444',
  //           borderWidth: 1,
  //           borderRadius: 6,
  //         },
  //       ],
  //     },
  //     options: {
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       plugins: { legend: { display: false } },
  //       scales: {
  //         x: {
  //           grid: { color: 'rgba(255,255,255,0.05)' },
  //           ticks: { color: '#8891a8', font: { size: 11 } },
  //         },
  //         y: {
  //           grid: { color: 'rgba(255,255,255,0.05)' },
  //           ticks: { color: '#8891a8', font: { size: 11 }, stepSize: 1 },
  //           beginAtZero: true,
  //         },
  //       },
  //     },
  //   });
  // }

  private renderRoleChart(): void {
    const ctx = document.getElementById('roleChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.roleChart?.destroy();
    const data = this.analytics.role_distribution;
    const labelMap: Record<string, string> = {
      citizen: 'Công dân',
      responder: 'Cứu hộ',
      admin: 'Admin',
    };
    this.roleChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((d: any) => labelMap[d.role] || d.role),
        datasets: [
          {
            data: data.map((d: any) => d.count),
            backgroundColor: ['#00bcd4', '#f59e0b', '#8b5cf6'],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8891a8', font: { size: 11 }, padding: 12, boxWidth: 10 },
          },
        },
      },
    });
  }

  // private renderUrgencyChart(): void {
  //   const ctx = document.getElementById('urgencyChart') as HTMLCanvasElement;
  //   if (!ctx) return;
  //   this.urgencyChart?.destroy();
  //   const data = this.analytics.urgency_breakdown;
  //   const labelMap: Record<string, string> = {
  //     critical: 'Khẩn cấp',
  //     high: 'Cao',
  //     medium: 'Trung bình',
  //     low: 'Thấp',
  //   };
  //   this.urgencyChart = new Chart(ctx, {
  //     type: 'doughnut',
  //     data: {
  //       labels: data.map((d: any) => labelMap[d.urgency_level] || d.urgency_level),
  //       datasets: [
  //         {
  //           data: data.map((d: any) => d.count),
  //           backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#22c55e'],
  //           borderWidth: 0,
  //           hoverOffset: 4,
  //         },
  //       ],
  //     },
  //     options: {
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       cutout: '70%',
  //       plugins: {
  //         legend: {
  //           position: 'bottom',
  //           labels: { color: '#8891a8', font: { size: 11 }, padding: 12, boxWidth: 10 },
  //         },
  //       },
  //     },
  //   });
  // }

  getTotalSos(): number {
    return (
      this.analytics?.status_breakdown?.reduce((sum: number, s: any) => sum + Number(s.count), 0) ||
      0
    );
  }

  getTotalUsers(): number {
    return (
      this.analytics?.role_distribution?.reduce(
        (sum: number, r: any) => sum + Number(r.count),
        0,
      ) || 0
    );
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Chờ xử lý',
      in_progress: 'Đang xử lý',
      resolved: 'Đã xử lý',
      assigned: 'Đang xử lý',
    };
    return map[status] || status;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      resolved: '#22c55e',
      assigned: '#3b82f6',
    };
    return map[status] || '#8891a8';
  }
}
