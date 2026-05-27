import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { SosService } from '../../../core/services/sos.service';
import { SosRequest, User } from '../../../models/interfaces';

type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

@Component({
  selector: 'app-citizen-sos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sos.html',
  styleUrl: './sos.scss',
})
export class SosComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  sosRequests: SosRequest[] = [];
  activeSos: SosRequest | null = null;

  showForm = false;
  loading = true;
  syncing = false;
  submitting = false;
  locating = false;

  gpsLabel = 'Chưa xác định vị trí';
  locationError = '';
  feedbackMessage = '';
  feedbackType: 'success' | 'error' | '' = '';
  lastSyncedAt = '';

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  private refreshHandle: ReturnType<typeof setInterval> | null = null;
  latitude: number | null = null;
  longitude: number | null = null;

  readonly urgencyOptions: Array<{ value: UrgencyLevel; label: string; tone: string }> = [
    { value: 'low', label: 'Thấp', tone: 'tone-low' },
    { value: 'medium', label: 'Trung bình', tone: 'tone-medium' },
    { value: 'high', label: 'Cao', tone: 'tone-high' },
    { value: 'critical', label: 'Nghiêm trọng', tone: 'tone-critical' },
  ];

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private sosService: SosService,
  ) {
    this.form = this.fb.group({
      address: ['', [Validators.required, Validators.minLength(8)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      urgency_level: ['medium' as UrgencyLevel, Validators.required],
      num_people: [1, [Validators.required, Validators.min(1), Validators.max(99)]],
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.resetFormDefaults();
    this.loadMySos(true);
    this.resolveLocation();
    this.refreshHandle = setInterval(() => this.loadMySos(false), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
    this.revokePreviews();
  }

  openForm(): void {
    this.showForm = true;
    this.feedbackMessage = '';
    this.feedbackType = '';
    if (!this.latitude || !this.longitude) {
      this.resolveLocation();
    }
  }

  closeForm(): void {
    this.showForm = false;
  }

  setUrgency(value: UrgencyLevel): void {
    this.form.patchValue({ urgency_level: value });
  }

  refreshNow(): void {
    this.loadMySos(false, true);
  }

  retryLocation(): void {
    this.resolveLocation();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleFiles(input.files);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.handleFiles(event.dataTransfer?.files || null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  removeFile(index: number): void {
    const preview = this.imagePreviews[index];
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  submitSos(): void {
    if (this.form.invalid || !this.latitude || !this.longitude) {
      this.form.markAllAsTouched();
      this.feedbackMessage = 'Vui lòng nhập đủ thông tin và chờ GPS sẵn sàng.';
      this.feedbackType = 'error';
      return;
    }

    const formData = new FormData();
    formData.append('latitude', String(this.latitude));
    formData.append('longitude', String(this.longitude));
    formData.append('address', this.form.value.address?.trim() || '');
    formData.append('description', this.form.value.description?.trim() || '');
    formData.append('urgency_level', this.form.value.urgency_level || 'medium');
    formData.append('num_people', String(this.form.value.num_people || 1));

    this.selectedFiles.forEach((file) => formData.append('images', file));

    this.submitting = true;
    this.feedbackMessage = '';
    this.feedbackType = '';

    this.sosService
      .create(formData)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.feedbackMessage = 'Đã gửi SOS thành công. Hệ thống đang theo dõi trạng thái.';
            this.feedbackType = 'success';
            this.closeForm();
            this.resetFormDefaults();
            this.loadMySos(true);
          }
        },
        error: () => {
          this.feedbackMessage = 'Gửi SOS thất bại, vui lòng thử lại.';
          this.feedbackType = 'error';
        },
      });
  }

  get activeRequest(): SosRequest | null {
    return this.activeSos;
  }

  get totalRequests(): number {
    return this.sosRequests.length;
  }

  get statusLabel(): string {
    if (!this.activeSos) return 'Chưa có yêu cầu đang mở';
    return this.getStatusLabel(this.activeSos.status);
  }

  get statusTone(): string {
    if (!this.activeSos) return 'tone-idle';
    return this.getStatusTone(this.activeSos.status);
  }

  get currentProgress(): number {
    if (!this.activeSos) return 0;

    const map: Record<string, number> = {
      pending: 1,
      assigned: 2,
      in_progress: 3,
      resolved: 4,
      cancelled: 0,
    };

    return map[this.activeSos.status] || 1;
  }

  get progressPercent(): number {
    return Math.min(100, this.currentProgress * 25);
  }

  get isTracking(): boolean {
    return !!this.activeSos && !['resolved', 'cancelled'].includes(this.activeSos.status);
  }

  get urgencyLabel(): string {
    return this.getUrgencyLabel(this.form.value.urgency_level || 'medium');
  }

  get canSubmit(): boolean {
    return this.form.valid && !!this.latitude && !!this.longitude && !this.submitting;
  }

  get addressControl() {
    return this.form.get('address');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  private loadMySos(showLoading: boolean, forceSync = false): void {
    if (showLoading) {
      this.loading = true;
    } else {
      this.syncing = true;
    }

    this.sosService
      .getMySos()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.syncing = false;
          this.lastSyncedAt = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        }),
      )
      .subscribe({
        next: (res) => {
          if (!res.success) return;
          this.sosRequests = res.data || [];
          this.activeSos =
            this.sosRequests.find((s) => !['resolved', 'cancelled'].includes(s.status)) || null;
          if (forceSync && this.activeSos) {
            this.feedbackMessage = 'Dữ liệu đã được cập nhật.';
            this.feedbackType = 'success';
          }
        },
        error: () => {
          this.loading = false;
          this.syncing = false;
          this.feedbackMessage = 'Không thể tải trạng thái SOS hiện tại.';
          this.feedbackType = 'error';
        },
      });
  }

  private resolveLocation(): void {
    this.locationError = '';
    this.locating = true;

    const applyLocation = (lat?: number, lng?: number) => {
      if (typeof lat === 'number' && typeof lng === 'number') {
        this.latitude = lat;
        this.longitude = lng;
        this.gpsLabel = `Đã lấy vị trí GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      } else {
        this.locationError = 'Không lấy được GPS. Vui lòng bật vị trí trên thiết bị.';
        this.gpsLabel = 'Chưa xác định vị trí';
      }
      this.locating = false;
    };

    if (this.currentUser?.latitude && this.currentUser?.longitude) {
      applyLocation(this.currentUser.latitude, this.currentUser.longitude);
      return;
    }

    if (!navigator.geolocation) {
      applyLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        applyLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  }

  private handleFiles(files: FileList | null): void {
    if (!files || files.length === 0) return;

    const incoming = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (incoming.length === 0) {
      this.feedbackMessage = 'Chỉ chấp nhận file ảnh PNG, JPG, WEBP.';
      this.feedbackType = 'error';
      return;
    }

    const remaining = 5 - this.selectedFiles.length;
    if (remaining <= 0) {
      this.feedbackMessage = 'Bạn chỉ được tải tối đa 5 hình ảnh.';
      this.feedbackType = 'error';
      return;
    }

    incoming.slice(0, remaining).forEach((file) => {
      this.selectedFiles.push(file);
      this.imagePreviews.push(URL.createObjectURL(file));
    });

    if (incoming.length > remaining) {
      this.feedbackMessage = 'Đã thêm tối đa số ảnh cho phép.';
      this.feedbackType = 'error';
    }
  }

  private resetFormDefaults(): void {
    this.form.reset({
      address: this.currentUser?.latitude && this.currentUser?.longitude ? '' : '',
      description: '',
      urgency_level: 'medium',
      num_people: 1,
    });
    this.revokePreviews();
    this.selectedFiles = [];
    this.imagePreviews = [];
  }

  private revokePreviews(): void {
    this.imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Đang chờ',
      assigned: 'Đã phân công',
      in_progress: 'Đang cứu hộ',
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

  getResponderLabel(): string {
    if (!this.activeSos) return 'Chưa có đội tiếp nhận';
    if (this.activeSos.status === 'pending') return 'Đang chờ điều phối đội cứu hộ';
    return this.activeSos.responder_name || this.activeSos.team_name || 'Đã có đội tiếp nhận';
  }

  getTimelineSteps(): Array<{ key: string; label: string; description: string }> {
    return [
      {
        key: 'pending',
        label: 'Chờ tiếp nhận',
        description: 'Hệ thống đã ghi nhận và đang điều phối đội cứu hộ.',
      },
      {
        key: 'assigned',
        label: 'Đội đã nhận',
        description: 'Một đội hoặc responder đã được phân công cho yêu cầu này.',
      },
      {
        key: 'in_progress',
        label: 'Đang di chuyển',
        description: 'Đội cứu hộ đang tới vị trí của bạn.',
      },
      {
        key: 'resolved',
        label: 'Đã xử lý xong',
        description: 'Yêu cầu SOS đã được hoàn tất.',
      },
    ];
  }
}
