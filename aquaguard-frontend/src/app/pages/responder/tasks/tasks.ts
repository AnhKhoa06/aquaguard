import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SosService } from '../../../core/services/sos.service';
import { SosRequest } from '../../../models/interfaces';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-responder-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class TasksComponent implements OnInit, OnDestroy {
  loading = true;
  sosRequests: SosRequest[] = [];
  selectedId: number | null = null;
  currentUserId: number | null = null;
  filterStatus = 'all';
  searchQuery = '';
  sortBy: 'priority' | 'newest' | 'oldest' = 'priority';
  private refreshHandle: ReturnType<typeof setInterval> | null = null;
  private locationHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private sosService: SosService,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadRequests();
    this.refreshHandle = setInterval(() => this.loadRequests(), 10000);
    this.startLocationTracking(); // ← thêm
    this.currentUserId = this.authService.getCurrentUser()?.id || null;
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) clearInterval(this.refreshHandle);
    if (this.locationHandle) clearInterval(this.locationHandle);
  }

  setFilter(status: string): void {
    this.filterStatus = status;
    const first = this.filteredRequests[0];
    this.selectedId = first ? first.id : null;
  }

  loadRequests(): void {
    this.sosService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.sosRequests = res.data || [];
          if (!this.selectedRequest) {
            const first = this.filteredRequests[0];
            this.selectedId = first ? first.id : null;
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  acceptTask(id: number): void {
    this.sosService.accept(id).subscribe({
      next: (res) => {
        if (res.success) this.loadRequests();
      },
    });
  }

  resolveTask(id: number): void {
    this.sosService.updateStatus(id, 'resolved').subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã hoàn thành nhiệm vụ!', 'Thành công');
          this.loadRequests();
        }
      },
      error: () => {
        this.toastr.error('Không thể cập nhật trạng thái.', 'Lỗi');
      },
    });
  }

  get filteredRequests(): SosRequest[] {
    const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

    return this.sosRequests
      .filter((r) => {
        if (this.filterStatus === 'all') return true; //  hiển thị tất cả
        return r.status === this.filterStatus;
      })
      .filter(
        (r) =>
          !this.searchQuery ||
          r.citizen_name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          r.address?.toLowerCase().includes(this.searchQuery.toLowerCase()),
      )
      .sort(
        (a, b) =>
          (urgencyOrder[a.urgency_level] ?? 4) - (urgencyOrder[b.urgency_level] ?? 4) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }

  get selectedRequest(): SosRequest | null {
    return this.sosRequests.find((r) => r.id === this.selectedId) || null;
  }

  get stats() {
    return {
      total: this.sosRequests.length,
      pending: this.sosRequests.filter((r) => r.status === 'pending').length,
      in_progress: this.sosRequests.filter((r) => r.status === 'in_progress').length,
      resolved: this.sosRequests.filter((r) => r.status === 'resolved').length,
    };
  }

  selectRequest(req: SosRequest): void {
    this.selectedId = req.id;
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

  getUrgencyLabel(level: string): string {
    const map: Record<string, string> = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Nghiêm trọng',
    };
    return map[level] || level;
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
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return `${Math.floor(diff / 2592000)} tháng trước`;
  }

  getAge(dob: string): number | null {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() - birth.getMonth() < 0 ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    )
      age--;
    return age;
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

  getResponderLabel(req: SosRequest): string {
    return req.responder_name || req.team_name || 'Chưa có người nhận';
  }

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }

  private startLocationTracking(): void {
    this.updateLocation(); // chạy ngay
    this.locationHandle = setInterval(() => this.updateLocation(), 15000); // mỗi 15 giây
  }

  private updateLocation(): void {
    const activeTask = this.sosRequests.find((r) => r.status === 'in_progress');
    console.log('updateLocation called, activeTask:', activeTask); // ← thêm
    if (!activeTask) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log('GPS got:', lat, lng); // ← thêm
        this.sosService.updateResponderLocation(activeTask.id, lat, lng).subscribe({
          next: (res) => console.log('location updated:', res), // ← thêm
          error: (err) => console.log('location error:', err), // ← thêm
        });
      },
      (err) => console.log('GPS error:', err), // ← thêm
      { enableHighAccuracy: true },
    );
  }
}
