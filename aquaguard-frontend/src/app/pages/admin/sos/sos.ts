import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SosService } from '../../../core/services/sos.service';
import { SosRequest } from '../../../models/interfaces';

@Component({
  selector: 'app-admin-sos',
  standalone: true,
  imports: [CommonModule],
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
  private refreshHandle: ReturnType<typeof setInterval> | null = null;

  constructor(private sosService: SosService) {}

  ngOnInit(): void {
    this.loadRequests(true);
    this.refreshHandle = setInterval(() => this.loadRequests(false), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }

  get filteredRequests(): SosRequest[] {
    return this.sosRequests.filter((request) => {
      const matchesStatus = this.filterStatus === 'all' || request.status === this.filterStatus;
      const haystack = `${request.citizen_name || ''} ${request.address || ''} ${request.team_name || ''}`.toLowerCase();
      const matchesSearch = !this.searchQuery || haystack.includes(this.searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
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

  refreshNow(): void {
    this.loadRequests(false);
  }

  selectRequest(request: SosRequest): void {
    this.selectedId = request.id;
  }

  updateStatus(status: 'in_progress' | 'resolved' | 'cancelled'): void {
    if (!this.selectedRequest) return;

    this.sosService.updateStatus(this.selectedRequest.id, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.feedbackMessage = 'Đã cập nhật trạng thái SOS.';
          this.feedbackType = 'success';
          this.loadRequests(false);
        }
      },
      error: () => {
        this.feedbackMessage = 'Không thể cập nhật trạng thái.';
        this.feedbackType = 'error';
      },
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Đang chờ',
      assigned: 'Đã phân công',
      in_progress: 'Đang xử lý',
      resolved: 'Đã hoàn tất',
      cancelled: 'Đã hủy',
    };
    return map[status] || status;
  }

  getStatusTone(status: string): string {
    const map: Record<string, string> = {
      pending: 'tone-pending',
      assigned: 'tone-assigned',
      in_progress: 'tone-progress',
      resolved: 'tone-resolved',
      cancelled: 'tone-cancelled',
    };
    return map[status] || 'tone-idle';
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
}
