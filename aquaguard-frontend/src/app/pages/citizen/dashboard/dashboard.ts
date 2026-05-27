import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SosService } from '../../../core/services/sos.service';
import { FamilyService } from '../../../core/services/family.service';
import { User, SosRequest } from '../../../models/interfaces';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  activeSos: SosRequest | null = null;
  sosHistory: SosRequest[] = [];
  familyMembers: User[] = [];
  loadingFamily = true;
  loadingSos = true;
  selectedStatus = '';

  constructor(
    private authService: AuthService,
    private sosService: SosService,
    private familyService: FamilyService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    console.log('health_status từ API:', this.currentUser?.health_status);
    this.selectedStatus = this.currentUser?.health_status || '';
    this.loadMySos();
    this.loadFamily();
  }

  setStatus(status: string) {
    this.selectedStatus = status;
  }

  loadMySos() {
    this.loadingSos = true;
    this.sosService.getMySos().subscribe({
      next: (res) => {
        this.loadingSos = false;
        if (res.success) {
          const all = res.data;
          // Tìm SOS đang hoạt động (chưa resolved/cancelled)
          this.activeSos = all.find((s) => !['resolved', 'cancelled'].includes(s.status)) || null;
          // Lịch sử (đã xong)
          this.sosHistory = all.filter((s) => ['resolved', 'cancelled'].includes(s.status));
        }
      },
      error: () => {
        this.loadingSos = false;
      },
    });
  }

  loadFamily() {
    this.loadingFamily = true;
    this.familyService.getFamily().subscribe({
      next: (res) => {
        this.loadingFamily = false;
        if (res.success) {
          this.familyMembers = res.data;
        }
      },
      error: () => {
        this.loadingFamily = false;
      },
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Chờ xử lý',
      assigned: 'Đã phân công',
      in_progress: 'Đang xử lý',
      resolved: 'Đã giải quyết',
      cancelled: 'Đã hủy',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      assigned: 'status-assigned',
      in_progress: 'status-progress',
      resolved: 'status-resolved',
      cancelled: 'status-cancelled',
    };
    return map[status] || '';
  }

  getHealthLabel(status: string): string {
    const map: Record<string, string> = {
      safe: 'An toàn',
      danger: 'Nguy hiểm',
      injured: 'Bị thương',
      unknown: 'Chưa rõ',
    };
    return map[status] || 'Chưa rõ';
  }

  getHealthClass(status: string): string {
    const map: Record<string, string> = {
      safe: 'health-safe',
      danger: 'health-danger',
      injured: 'health-injured',
      unknown: 'health-unknown',
    };
    return map[status] || 'health-unknown';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  getUrgencyLabel(level: string): string {
    const map: Record<string, string> = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Khẩn cấp',
    };
    return map[level] || level;
  }
}
