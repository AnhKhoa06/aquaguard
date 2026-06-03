import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { finalize } from 'rxjs';
import * as L from 'leaflet';

import { AuthService } from '../../../core/services/auth.service';
import { SosService } from '../../../core/services/sos.service';
import { UserService } from '../../../core/services/user.service';
import { SosRequest, User } from '../../../models/interfaces';
import { ToastrService } from 'ngx-toastr';

import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../../environments/environment';

type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

@Component({
  selector: 'app-citizen-sos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sos.html',
  styleUrl: './sos.scss',
})
export class SosComponent implements OnInit, OnDestroy {
  private readonly trackIcon = L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  private readonly citizenIcon = L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  currentUser: User | null = null;
  sosRequests: SosRequest[] = [];
  activeSos: SosRequest | null = null;

  showForm = false;
  showTracking = false;
  loading = true;
  syncing = false;
  submitting = false;
  locating = false;

  gpsLabel = 'Chưa xác định vị trí';
  locationError = '';
  feedbackMessage = '';
  feedbackType: 'success' | 'error' | '' = '';
  lastSyncedAt = '';
  trackingStatusLabel = 'Đang chờ điều phối';
  trackingResponderLabel = 'Chưa có đội tiếp nhận';
  trackingTeamLabel = 'Chưa có nhóm xử lý';
  trackingUpdatedAt = '';

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  private refreshHandle: ReturnType<typeof setInterval> | null = null;
  private trackingRefreshHandle: ReturnType<typeof setInterval> | null = null;
  private trackingMap: L.Map | null = null;
  private trackingCitizenMarker: L.Marker | null = null;
  private trackingResponderMarker: L.Marker | null = null;
  private trackingRouteLayer: L.Polyline | null = null;
  private hasInitialFit = false;
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
    private userService: UserService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef, // ← thêm
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
    if (this.trackingRefreshHandle) {
      clearInterval(this.trackingRefreshHandle);
      this.trackingRefreshHandle = null;
    }
    this.destroyTrackingMap();
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

  openTracking(): void {
    if (!this.activeSos) {
      this.toastr.info('Chưa có yêu cầu SOS đang hoạt động.', 'Thông tin');
      return;
    }

    this.showTracking = true;
    this.syncTrackingMeta();

    setTimeout(() => {
      this.initTrackingMap();
      this.trackingMap?.invalidateSize();
      this.renderTrackingRoute();
    }, 500); // ← tăng lên 500ms

    if (!this.trackingRefreshHandle) {
      this.trackingRefreshHandle = setInterval(() => {
        this.loadMySos(false);
      }, 8000);
    }
  }

  closeTracking(): void {
    this.showTracking = false;
    this.hasInitialFit = false;
    if (this.trackingRefreshHandle) {
      clearInterval(this.trackingRefreshHandle);
      this.trackingRefreshHandle = null;
    }
    this.destroyTrackingMap();
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

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }

  submitSos(): void {
    if (!this.latitude || !this.longitude) {
      this.toastr.warning('Vui lòng chờ GPS sẵn sàng!', 'Thiếu thông tin');
      return;
    }

    if (!this.form.value.description?.trim()) {
      this.toastr.warning('Vui lòng mô tả tình huống!', 'Thiếu thông tin');
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
    return true;
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
            this.sosRequests.length > 0
              ? this.sosRequests[0] // lấy cái mới nhất
              : null;
          console.log('activeSos:', this.activeSos);
          this.syncTrackingMeta();
          if (this.showTracking) {
            this.renderTrackingRoute();
          }
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

        this.userService.reverseGeocode(lat, lng).subscribe({
          next: (res) => {
            const address = res.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            this.form.patchValue({ address });
          },
          error: () => {
            this.form.patchValue({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
          },
        });
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
      // Dùng FileReader thay vì createObjectURL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.push(e.target?.result as string);
        this.cdr.detectChanges(); // ← thêm dòng này
      };
      reader.readAsDataURL(file);
    });
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
      assigned: 'Đang xử lý',
      in_progress: 'Đang xử lý',
      resolved: 'Đã giải quyết',
    };
    return map[status] || status;
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      pending: 'schedule',
      assigned: 'badge',
      in_progress: 'local_shipping',
      resolved: 'check',
    };
    return map[status] || 'info';
  }

  getStatusTone(status: string): string {
    const map: Record<string, string> = {
      pending: 'tone-pending',
      assigned: 'tone-progress',
      in_progress: 'tone-progress',
      resolved: 'tone-resolved',
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
        key: 'in_progress',
        label: 'Đang di chuyển',
        description: 'Đội cứu hộ đang tới vị trí của bạn.',
      },
      {
        key: 'resolved',
        label: 'Đã giải quyết',
        description: 'Yêu cầu SOS đã được hoàn tất.',
      },
    ];
  }

  getTrackingSubtitle(): string {
    if (!this.activeSos) return 'Trực tiếp - chưa có yêu cầu';
    if (this.activeSos.responder_name || this.activeSos.team_name) {
      return 'Trực tiếp - đã kết nối';
    }
    return 'Trực tiếp - đang chờ tiếp nhận';
  }

  private syncTrackingMeta(): void {
    if (!this.activeSos) {
      this.trackingStatusLabel = 'Chưa có yêu cầu đang theo dõi';
      this.trackingResponderLabel = 'Chưa có đội tiếp nhận';
      this.trackingTeamLabel = 'Chưa có nhóm xử lý';
      return;
    }

    this.trackingStatusLabel = this.getStatusLabel(this.activeSos.status);
    this.trackingResponderLabel = this.activeSos.responder_name || 'Chưa có đội tiếp nhận';
    this.trackingTeamLabel = this.activeSos.team_name || 'Chưa có nhóm xử lý';
    this.trackingUpdatedAt = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private initTrackingMap(): void {
    if (!this.showTracking) return;

    const mapElement = document.getElementById('tracking-map');
    if (!mapElement) return;

    if (this.trackingMap) return; // ← chỉ return, không invalidateSize

    this.trackingMap = L.map('tracking-map', {
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps',
      maxZoom: 20,
    }).addTo(this.trackingMap);
  }

  private destroyTrackingMap(): void {
    if (this.trackingRouteLayer) {
      this.trackingRouteLayer.remove();
      this.trackingRouteLayer = null;
    }
    if (this.trackingCitizenMarker) {
      this.trackingCitizenMarker.remove();
      this.trackingCitizenMarker = null;
    }
    if (this.trackingResponderMarker) {
      this.trackingResponderMarker.remove();
      this.trackingResponderMarker = null;
    }
    if (this.trackingMap) {
      this.trackingMap.remove();
      this.trackingMap = null;
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildCitizenPopup(): string {
    const name = this.escapeHtml(this.currentUser?.full_name || '');
    const phone = this.escapeHtml(this.currentUser?.phone || '');
    return `
    <div style="min-width: 200px; font-family: Inter, Arial, sans-serif; padding: 4px 0;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
        <span class="material-symbols-outlined" style="font-size:20px; color:#ef4444; font-variation-settings:'FILL' 1;">person</span>
        <span style="font-weight:800; font-size:15px; color:#0f172a;">${name}</span>
      </div>
      <div style="font-size:13px; color:#64748b; margin-bottom:6px;">Người cần cứu hộ</div>
      <div style="display:flex; align-items:center; gap:6px; font-size:13px; color:#475569;">
        <span class="material-symbols-outlined" style="font-size:16px;">call</span>
        ${phone}
      </div>
    </div>
  `;
  }

  private buildResponderPopup(): string {
    const responderName = this.escapeHtml(this.activeSos?.responder_name || 'Đội cứu hộ');
    const teamName = this.escapeHtml(this.activeSos?.team_name || '');
    return `
    <div style="min-width: 200px; font-family: Inter, Arial, sans-serif; padding: 4px 0;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
        <span class="material-symbols-outlined" style="font-size:20px; color:#2563eb; font-variation-settings:'FILL' 1;">siren</span>
        <span style="font-weight:800; font-size:15px; color:#0f172a;">${responderName}</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px; font-size:13px; color:#64748b; margin-bottom:6px;">
        <span class="material-symbols-outlined" style="font-size:16px;">groups</span>
        ${teamName}
      </div>
      <div style="display:flex; align-items:center; gap:6px; font-size:13px; color:#475569;">
        <span class="material-symbols-outlined" style="font-size:16px;">local_shipping</span>
        Đang đến ứng cứu
      </div>
    </div>
  `;
  }

  private renderTrackingRoute(): void {
    if (!this.trackingMap || !this.activeSos) return;

    const citizenLat = this.activeSos.latitude ?? this.latitude;
    const citizenLng = this.activeSos.longitude ?? this.longitude;
    const responderLat = this.activeSos.responder_latitude;
    const responderLng = this.activeSos.responder_longitude;

    // Xóa layer cũ
    if (this.trackingRouteLayer) {
      this.trackingRouteLayer.remove();
      this.trackingRouteLayer = null;
    }
    if (this.trackingCitizenMarker) {
      this.trackingCitizenMarker.remove();
      this.trackingCitizenMarker = null;
    }
    if (this.trackingResponderMarker) {
      this.trackingResponderMarker.remove();
      this.trackingResponderMarker = null;
    }

    if (typeof citizenLat !== 'number' || typeof citizenLng !== 'number') return;

    // Marker công dân — xanh dương

    this.trackingCitizenMarker = L.marker([citizenLat, citizenLng], { icon: this.citizenIcon })
      .addTo(this.trackingMap)
      .bindPopup(this.buildCitizenPopup(), { closeButton: false, offset: [0, -34] });

    this.trackingCitizenMarker.openPopup();

    // ← thêm đoạn này vào đây
    if (this.activeSos.status === 'pending') {
      L.marker([citizenLat, citizenLng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            background: #f59e0b;
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            font-family: Inter, sans-serif;
            white-space: nowrap;
            width: max-content;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span class="material-symbols-outlined" style="font-size:16px;">schedule</span>
            Đang chờ cứu hộ tiếp nhận...
          </div>`,
          iconAnchor: [80, -20],
        }),
      }).addTo(this.trackingMap);

      if (!this.hasInitialFit) {
        this.trackingMap.setView([citizenLat, citizenLng], 15);
        this.hasInitialFit = true;
      }
      return;
    }

    const boundsPoints: L.LatLngExpression[] = [[citizenLat, citizenLng]];

    if (typeof responderLat === 'number' && typeof responderLng === 'number') {
      const responderIcon = L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      this.trackingResponderMarker = L.marker([responderLat, responderLng], { icon: responderIcon })
        .addTo(this.trackingMap)
        .bindPopup(this.buildResponderPopup(), { closeButton: false, offset: [0, -34] });

      // Màu đường theo status
      const lineColor = this.activeSos.status === 'resolved' ? '#1a73e8' : '#f59e0b';

      const distance = this.trackingMap!.distance(
        [citizenLat, citizenLng],
        [responderLat, responderLng],
      );

      if (distance < 10) {
        if (!this.hasInitialFit) {
          setTimeout(() => {
            this.trackingMap!.invalidateSize();
            this.trackingMap!.setView([citizenLat as number, citizenLng as number], 15);
            this.hasInitialFit = true;
          }, 300);
        }
        return; // ← thêm dòng này để không fetch OSRM
      } else {
        fetch(
          `https://router.project-osrm.org/route/v1/driving/${citizenLng},${citizenLat};${responderLng},${responderLat}?overview=full&geometries=geojson`,
        )
          .then((r) => r.json())
          .then((data) => {
            const routeData = data.routes[0];
            const coords = data.routes[0].geometry.coordinates.map(
              (c: number[]) => [c[1], c[0]] as L.LatLngExpression,
            );

            this.trackingRouteLayer = L.polyline(coords, {
              color: lineColor,
              weight: 5,
              opacity: 0.9,
            }).addTo(this.trackingMap!);

            // ← Thêm distance label
            const distanceKm = (routeData.distance / 1000).toFixed(1);
            const durationMin = Math.round(routeData.duration / 60);
            const midIndex = Math.floor(coords.length / 2);
            const midPoint = coords[midIndex] as [number, number];

            L.marker(midPoint, {
              icon: L.divIcon({
                className: '',
                html: `<div style="
                  background: #1a73e8;
                  color: white;
                  padding: 6px 14px;
                  border-radius: 20px;
                  font-size: 13px;
                  font-weight: 700;
                  font-family: Inter, sans-serif;
                  white-space: nowrap;
                  width: max-content;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <span class="material-symbols-outlined" style="font-size:16px;">route</span>
                  ${distanceKm} km · ~${durationMin} phút
                </div>`,
                iconSize: undefined,
                iconAnchor: [80, 16], // ← tăng lên
              }),
            }).addTo(this.trackingMap!);

            // Chỉ fitBounds lần đầu
            // Chỉ fitBounds lần đầu
            if (!this.hasInitialFit) {
              const bounds = L.polyline(coords).getBounds();
              if (bounds.isValid()) {
                this.trackingMap!.fitBounds(bounds, { padding: [60, 60] });
              } else {
                this.trackingMap!.setView([citizenLat as number, citizenLng as number], 15);
              }
              this.hasInitialFit = true;
            }
          });
      }

      boundsPoints.push([responderLat, responderLng]);
    }

    setTimeout(() => this.trackingMap?.invalidateSize(), 50);
  }
}
