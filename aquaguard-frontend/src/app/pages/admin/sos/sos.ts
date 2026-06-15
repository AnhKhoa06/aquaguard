import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { SosService } from '../../../core/services/sos.service';
import { SosRequest } from '../../../models/interfaces';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-admin-sos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgTemplateOutlet],
  templateUrl: './sos.html',
  styleUrl: './sos.scss',
})
export class SosComponent implements OnInit, OnDestroy {
  loading = true;
  refreshing = false;
  sosRequests: SosRequest[] = [];
  selectedId: number | null = null;
  filterStatus = 'all';
  searchQuery = '';
  feedbackMessage = '';
  feedbackType: 'success' | 'error' | '' = '';
  sortBy: 'priority' | 'newest' | 'oldest' = 'priority';

  //
  responders: any[] = [];
  selectedResponderId: number | null = null;

  private refreshHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private sosService: SosService,
    private userService: UserService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadRequests(true);
    this.refreshHandle = setInterval(() => this.loadRequests(false), 10000);
    this.loadResponders();
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }

  setSortBy(value: 'priority' | 'newest' | 'oldest'): void {
    this.sortBy = value;
    const first = this.filteredRequests[0];
    this.selectedId = first ? first.id : null;
  }

  get filteredRequests(): SosRequest[] {
    let list = this.sosRequests.filter(
      (r: SosRequest) =>
        (this.filterStatus === 'all' || r.status === this.filterStatus) &&
        (!this.searchQuery ||
          r.citizen_name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          r.address?.toLowerCase().includes(this.searchQuery.toLowerCase())),
    );

    if (this.sortBy === 'newest') {
      list = list.sort(
        (a: SosRequest, b: SosRequest) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (this.sortBy === 'oldest') {
      list = list.sort(
        (a: SosRequest, b: SosRequest) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    } else {
      const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      list = list.sort(
        (a: SosRequest, b: SosRequest) =>
          (urgencyOrder[a.urgency_level] ?? 4) - (urgencyOrder[b.urgency_level] ?? 4) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return list;
  }

  get selectedRequest(): SosRequest | null {
    return this.sosRequests.find((request) => request.id === this.selectedId) || null;
  }

  get stats() {
    return {
      total: this.sosRequests.length,
      pending: this.sosRequests.filter((r) => r.status === 'pending').length,
      in_progress: this.sosRequests.filter((r) => r.status === 'in_progress').length,
      resolved: this.sosRequests.filter((r) => r.status === 'resolved').length,
    };
  }

  loadRequests(showLoading: boolean): void {
    if (showLoading) this.loading = true;
    else this.refreshing = true;

    this.sosService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.sosRequests = res.data || [];
          if (!this.selectedRequest && this.sosRequests.length > 0) {
            this.selectedId = this.sosRequests[0].id;
          }
          this.feedbackMessage = '';
        }
        this.loading = false;
        this.refreshing = false;
      },
      error: () => {
        this.loading = false;
        this.refreshing = false;
        this.feedbackMessage = 'Không tải được danh sách SOS.';
        this.feedbackType = 'error';
      },
    });
  }

  selectRequest(request: SosRequest): void {
    this.selectedId = request.id;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Đang chờ',
      assigned: 'Đang xử lý', // ← đổi từ 'Đã phân công'
      in_progress: 'Đang xử lý',
      resolved: 'Đã xử lý',
    };
    return map[status] || status;
  }

  getStatusTone(status: string): string {
    const map: Record<string, string> = {
      pending: 'tone-pending',
      assigned: 'tone-assigned',
      in_progress: 'tone-progress',
      resolved: 'tone-resolved',
    };
    return map[status] || '';
  }

  resolveTask(id: number): void {
    this.sosService.updateStatus(id, 'resolved').subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã xác nhận hoàn thành!', 'Thành công');
          this.loadRequests(false);
        }
      },
      error: () => {
        this.toastr.error('Không thể cập nhật trạng thái.', 'Lỗi');
      },
    });
  }

  getUrgencyLabel(level: string): string {
    const map: Record<string, string> = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Nghiêm trọng',
    };
    return map[level] || level;
  }

  getResponderLabel(request: SosRequest): string {
    return request.responder_name || request.team_name || 'Chưa có người nhận';
  }

  getInitials(name: string): string {
    return name
      .trim()
      .split(' ')
      .filter((n) => n)
      .map((n) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  }
  // method
  loadResponders(): void {
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.responders = res.data.filter((u: any) => u.role === 'responder');
        }
      },
    });
  }

  assignResponder(): void {
    if (!this.selectedRequest || !this.selectedResponderId) return;

    if (this.selectedRequest.status === 'in_progress' || this.selectedRequest.responder_id) {
      this.toastr.error('Yêu cầu này đã có người nhận, không thể phân công!', 'Lỗi');
      return;
    }

    this.sosService.assignResponder(this.selectedRequest.id, this.selectedResponderId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã phân công người cứu hộ!', 'Thành công');
          this.selectedResponderId = null;
          this.loadRequests(false);
        }
      },
      error: () => {
        this.toastr.error('Không thể phân công — người này chưa có đội cứu hộ.', 'Lỗi');
      },
    });
  }
  getSortLabel(): string {
    const map: Record<string, string> = {
      priority: 'Ưu tiên',
      newest: 'Mới nhất',
      oldest: 'Cũ nhất',
    };
    return map[this.sortBy];
  }

  getTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
    return `${Math.floor(diff / 31536000)} năm trước`;
  }

  getAge(dob: string): number | null {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }
}
