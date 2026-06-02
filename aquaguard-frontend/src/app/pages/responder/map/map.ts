import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { SosService } from '../../../core/services/sos.service';
import { AlertService } from '../../../core/services/alert.service';
import { SafePipe } from '../../../core/pipes/safe.pipe';
import { SosRequest, Alert } from '../../../models/interfaces';
import { FloodService } from '../../../core/services/flood.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import 'leaflet.markercluster';

@Component({
  selector: 'app-responder-map',
  standalone: true,
  imports: [CommonModule, RouterModule, SafePipe],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map!: L.Map;
  private sosMarkers: L.Marker[] = [];
  private userMarker: L.Marker | null = null;
  private floodLayers: any[] = [];

  sosList: SosRequest[] = [];
  filteredSosList: SosRequest[] = [];
  alerts: Alert[] = [];
  teamMembers: any[] = []; // sẽ load từ API sau
  myTeam: any = null;

  showWindyPanel = false;
  showFloodZone = false;
  showWindy = false;
  windyLoaded = false;
  selectedWindyLayer = 'rain';
  activeTab: 'requests' | 'team' = 'requests';
  activeFilter: 'all' | 'pending' | 'in_progress' | 'resolved' = 'all';
  loading = true;
  locating = false;
  locationName = '';

  userLat: number | null = null;
  userLng: number | null = null;
  riskLevel: 'safe' | 'warning' | 'danger' | 'critical' = 'safe';

  windyLayers = [
    { key: 'rain', label: 'Mưa', icon: 'grain' },
    { key: 'wind', label: 'Gió', icon: 'air' },
    { key: 'clouds', label: 'Mây', icon: 'cloud' },
    { key: 'temp', label: 'Nhiệt độ', icon: 'thermometer' },
    { key: 'pressure', label: 'Áp suất', icon: 'speed' },
    { key: 'waves', label: 'Sóng biển', icon: 'waves' },
  ];

  constructor(
    private sosService: SosService,
    private alertService: AlertService,
    private floodService: FloodService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadSos();
    this.loadAlerts();
    this.loadWeatherAlerts();
    this.loadMyTeam();
  }

  ngAfterViewInit() {
    this.initMap();
    this.loadFloodData();
    this.locateMe();
    // Lắng nghe event nhận nhiệm vụ từ popup
    window.addEventListener('accept-sos', (e: any) => {
      this.acceptTask(e.detail);
    });
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  // ── giữ nguyên initMap, loadAlerts, loadWeatherAlerts, loadFloodData,
  //    computeRisk, renderSosMarkers, buildPopup, toggleWindyPanel,
  //    toggleWindy, toggleFloodZone, getWindyUrl, selectWindyLayer,
  //    locateMe, getLocationName, getSeverityLabel, getSeverityClass,
  //    getSeverityIcon, getRiskLabel, getRiskIcon, getUrgencyLabel ──

  private initMap() {
    this.map = L.map('map', {
      center: [16.047, 108.206],
      zoom: 6,
      zoomControl: false,
    });
    L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps',
      maxZoom: 20,
    }).addTo(this.map);
    L.control.zoom({ position: 'topleft' }).addTo(this.map);
  }

  private loadSos() {
    this.sosService.getAllForMap().subscribe({
      next: (res) => {
        if (res.success) {
          this.sosList = res.data.filter((s: any) => s.latitude && s.longitude);
          this.applyFilter();
          this.loading = false;
          if (this.map) this.renderSosMarkers();
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadMyTeam(): void {
    this.http.get<any>(`${environment.apiUrl}/rescue-teams/my-team`).subscribe({
      next: (res) => {
        console.log('myTeam response:', res);
        if (res.success) this.myTeam = res.data;
      },
      error: (err) => {
        console.log('myTeam error:', err);
      },
    });
  }

  // ── THÊM MỚI: filter theo status ──
  applyFilter() {
    this.filteredSosList =
      this.activeFilter === 'all'
        ? this.sosList
        : this.sosList.filter((s) => s.status === this.activeFilter);
    if (this.map) this.renderSosMarkers();
  }

  setFilter(filter: 'all' | 'pending' | 'in_progress' | 'resolved') {
    this.activeFilter = filter;
    this.applyFilter();
  }

  // ── THÊM MỚI: zoom vào marker khi click item trong list ──
  focusMarker(sos: SosRequest) {
    this.map.setView([sos.latitude, sos.longitude], 17, { animate: true });
    const marker = this.sosMarkers[this.filteredSosList.indexOf(sos)];
    if (marker) marker.openPopup();
  }

  // ── THÊM MỚI: nhận nhiệm vụ ──
  acceptTask(sosId: number) {
    this.sosService.accept(sosId).subscribe({
      next: (res) => {
        if (res.success) this.loadSos();
      },
    });
  }

  private loadAlerts() {
    this.alertService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.alerts = res.data;
          this.computeRisk();
        }
      },
    });
  }

  private getLocationName(lat: number, lng: number) {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
    ) //Nominatim là service geocoding miễn phí của OpenStreetMap —
      // là API tra cứu địa danh theo tọa độ
      .then((r) => r.json())
      .then((data) => {
        const state = data.address?.state || ''; //lấy tên tỉnh/thành
        const country = data.address?.country || ''; //lấy tên quốc gia
        this.locationName = `${state}, ${country}`; //gán vào biến hiển thị
      });
  }

  private loadWeatherAlerts() {
    const locations = [
      { name: 'Đà Nẵng', lat: 16.047, lng: 108.206 },
      { name: 'Huế', lat: 16.463, lng: 107.59 },
      { name: 'Quảng Nam', lat: 15.879, lng: 108.335 },
      { name: 'Quảng Ngãi', lat: 15.12, lng: 108.792 },
      { name: 'Bình Định', lat: 13.782, lng: 109.219 },
      { name: 'Quảng Bình', lat: 17.469, lng: 106.622 },
    ];

    const requests = locations.map((loc) =>
      this.http.get<any>(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=precipitation,rain,windspeed_10m,weathercode&forecast_days=1`,
      ),
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const autoAlerts: Alert[] = [];
        results.forEach((data, i) => {
          const current = data.current;
          const name = locations[i].name;
          if (current.rain > 0) {
            autoAlerts.push({
              id: Math.floor(Math.random() * -1000),
              created_by: 0,
              title: `Mưa lớn tại ${name}`,
              message: `Lượng mưa ${current.rain}mm/h, nguy cơ ngập lụt cao.`,
              severity: current.rain > 30 ? 'critical' : 'danger',
              created_at: new Date().toISOString(),
            });
          }
          if (current.windspeed_10m > -1) {
            autoAlerts.push({
              id: Math.floor(Math.random() * -1000),
              created_by: 0,
              title: `Gió mạnh tại ${name}`,
              message: `Tốc độ gió ${current.windspeed_10m}km/h, cần cẩn thận khi ra ngoài.`,
              severity: current.windspeed_10m > 90 ? 'critical' : 'warning',
              created_at: new Date().toISOString(),
            });
          }
          if (current.precipitation > 0) {
            autoAlerts.push({
              id: Math.floor(Math.random() * -1000),
              created_by: 0,
              title: `Lượng mưa cao tại ${name}`,
              message: `Tổng lượng mưa ${current.precipitation}mm, theo dõi tình hình lũ.`,
              severity: 'warning',
              created_at: new Date().toISOString(),
            });
          }
        });
        this.alerts = [...autoAlerts, ...this.alerts];
        this.computeRisk();
      },
      error: (err) => console.log('Weather error:', err.message),
    });

    navigator.geolocation.getCurrentPosition((pos) => {
      this.http
        .get<any>(
          `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=precipitation,rain,windspeed_10m&forecast_days=1`,
        )
        .subscribe({
          next: (data) => {
            const c = data.current;
            if (c.rain > 30 || c.windspeed_10m > 90) this.riskLevel = 'critical';
            else if (c.rain > 10 || c.windspeed_10m > 60) this.riskLevel = 'danger';
            else if (c.rain > 2 || c.windspeed_10m > 30 || c.precipitation > 1)
              this.riskLevel = 'warning';
            else this.riskLevel = 'safe';
          },
        });
    });
  }

  private loadFloodData() {
    setTimeout(() => {
      this.floodService.getFloodData().subscribe({
        next: (res) => {
          if (res.success) {
            this.floodLayers.forEach((l) => l.remove());
            this.floodLayers = [];

            const color: Record<string, string> = {
              critical: '#ef4444',
              high: '#f97316',
              moderate: '#f59e0b',
              safe: '#22c55e',
            };

            const icons: Record<string, L.DivIcon> = {};
            Object.keys(color).forEach((level) => {
              icons[level] = L.divIcon({
                className: '',
                html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="${color[level]}"/>
                <circle cx="12" cy="11" r="5" fill="white" opacity="0.9"/>
              </svg>`,
                iconSize: [24, 32],
                iconAnchor: [12, 32],
              });
            });

            // Fix lỗi markerClusterGroup is not a function
            if (!(L as any).markerClusterGroup) {
              console.warn('markerClusterGroup not available, skipping clusters');
              res.data.forEach((point: any) => {
                const icon = icons[point.risk_level] || icons['safe'];
                const marker = L.marker([point.latitude, point.longitude], { icon }).addTo(
                  this.map,
                );
                this.floodLayers.push(marker as any);
              });
              this.showFloodZone = true;
              this.cdr.detectChanges(); // ← fix NG0100
              return;
            }

            const clusterGroup = (L as any).markerClusterGroup({
              maxClusterRadius: 60,
              showCoverageOnHover: false,
              zoomToBoundsOnClick: true,
              spiderfyOnMaxZoom: false,
              disableClusteringAtZoom: 10,
              iconCreateFunction: (cluster: any) => {
                const firstMarker = cluster.getAllChildMarkers()[0];
                const lat = firstMarker.getLatLng().lat;
                const point = res.data.find((p: any) => p.latitude === lat);
                const c = point ? color[point.risk_level] || '#64748b' : '#64748b';
                return L.divIcon({
                  className: '',
                  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 24 32">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="${c}"/>
                  <circle cx="12" cy="11" r="5" fill="white" opacity="0.9"/>
                </svg>`,
                  iconSize: [32, 42],
                  iconAnchor: [16, 42],
                });
              },
            });

            res.data.forEach((point: any) => {
              const icon = icons[point.risk_level] || icons['safe'];
              const marker = L.marker([point.latitude, point.longitude], { icon });
              clusterGroup.addLayer(marker);
            });

            this.map.addLayer(clusterGroup);
            this.floodLayers.push(clusterGroup as any);
            this.showFloodZone = true;
            this.cdr.detectChanges(); // ← fix NG0100
          }
        },
        error: () => {},
      });
    }, 100);
  }

  private computeRisk() {
    if (this.alerts.some((a) => a.severity === 'critical')) this.riskLevel = 'critical';
    else if (this.alerts.some((a) => a.severity === 'danger')) this.riskLevel = 'danger';
    else if (this.alerts.some((a) => a.severity === 'warning')) this.riskLevel = 'warning';
    else this.riskLevel = 'safe';
  }

  private renderSosMarkers() {
    this.sosMarkers.forEach((m) => m.remove());
    this.sosMarkers = [];

    this.filteredSosList.forEach((sos) => {
      const name = sos.citizen_name || 'Ẩn danh';
      const initials = name
        .trim()
        .split(' ')
        .filter((n: string) => n.length > 0)
        .map((n: string) => n[0])
        .slice(-2)
        .join('')
        .toUpperCase();

      const colorMap: Record<string, string> = {
        pending: '#ef4444',
        in_progress: '#f59e0b',
        assigned: '#f59e0b',
        resolved: '#22c55e',
      };
      const bg = colorMap[sos.status] ?? '#ef4444';
      const isPending = sos.status === 'pending';

      const statusLabelMap: Record<string, string> = {
        pending: 'Chờ xử lý',
        assigned: 'Đang xử lý',
        in_progress: 'Đang xử lý',
        resolved: 'Đã cứu',
      };
      const statusLabel = statusLabelMap[sos.status] ?? sos.status;

      const ringHtml = isPending
        ? `<div style="position:absolute;top:0;left:0;width:44px;height:44px;border-radius:50%;border:2.5px solid #ef4444;animation:sos-pulse 1.8s ease-out infinite;pointer-events:none;"></div>`
        : '';

      const icon = L.divIcon({
        className: '',
        html: `
        <style>@keyframes sos-pulse{0%{transform:scale(0.75);opacity:1;}70%{transform:scale(1.75);opacity:0;}100%{transform:scale(0.75);opacity:0;}}</style>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
            ${ringHtml}
            <div style="position:relative;z-index:1;width:40px;height:40px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
              <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:0.03em;line-height:1;">${initials}</span>
            </div>
          </div>
          <div style="background:${bg};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);">
            ${statusLabel}
          </div>
        </div>`,
        iconSize: [60, 70],
        iconAnchor: [30, 70],
        popupAnchor: [0, -72],
      });

      const marker = L.marker([sos.latitude, sos.longitude], { icon })
        .addTo(this.map)
        .bindPopup(this.buildPopup(sos), {
          className: 'sos-popup-wrap',
          maxWidth: 320,
          minWidth: 250,
        });

      this.sosMarkers.push(marker);
    });
  }

  private buildPopup(sos: any): string {
    const name = sos.citizen_name || 'Ẩn danh';
    const colorMap: Record<string, string> = {
      pending: 'ef4444',
      in_progress: 'f59e0b',
      assigned: 'f59e0b',
      resolved: '22c55e',
    };
    const avatarColor = colorMap[sos.status] ?? 'ef4444';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${avatarColor}&color=fff&size=40`;

    const urgencyMap: Record<string, string> = {
      critical: 'Cực kỳ nguy hiểm',
      high: 'Nghiêm trọng',
      medium: 'Trung bình',
      low: 'Nhẹ',
    };
    const statusMap: Record<string, string> = {
      pending: 'Chờ xử lý',
      assigned: 'Đang xử lý',
      in_progress: 'Đang xử lý',
      resolved: 'Đã cứu',
    };
    const statusColor: Record<string, string> = {
      pending: '#ef4444',
      assigned: '#f59e0b',
      in_progress: '#f59e0b',
      resolved: '#22c55e',
    };

    const statusLabel = statusMap[sos.status] ?? sos.status;
    const sColor = statusColor[sos.status] ?? '#64748b';
    const time = sos.created_at
      ? new Date(sos.created_at).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '';

    const acceptBtn =
      sos.status === 'pending'
        ? `<button onclick="window.dispatchEvent(new CustomEvent('accept-sos', {detail: ${sos.id}}))"
         style="margin-top:10px;width:100%;padding:8px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">
         Nhận nhiệm vụ
       </button>`
        : '';

    return `
    <div style="padding:14px 14px 12px;min-width:250px;font-family:inherit;">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;padding-right:20px;">
        <img src="${avatarUrl}" alt="${name}" referrerpolicy="no-referrer"
          style="width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,0.9);object-fit:cover;flex-shrink:0;"/>
        <div style="min-width:0;flex:1;display:flex;flex-direction:column;gap:4px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#f1f5f9;">${name}</p>
          ${
            sos.address
              ? `
          <div style="display:flex;align-items:flex-start;gap:4px;font-size:10px;color:#64748b;line-height:1.4;max-width:200px;">
            <span class="material-symbols-outlined" style="font-size:12px;flex-shrink:0;margin-top:1px;">location_on</span>
            <span>${sos.address}</span>
          </div>`
              : ''
          }
          <span style="display:inline-block;background:rgba(255,255,255,0.08);color:#94a3b8;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;width:fit-content;">
            Mức độ: ${urgencyMap[sos.urgency_level] || sos.urgency_level || 'Không rõ'}
          </span>
        </div>
      </div>
      ${sos.description ? `<p style="margin:0 0 10px;font-size:11px;color:#94a3b8;line-height:1.5;">${sos.description}</p>` : ''}
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;flex-wrap:wrap;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
        <span style="display:inline-flex;align-items:center;gap:4px;background:${sColor}22;color:${sColor};font-weight:700;padding:3px 10px;border-radius:999px;font-size:11px;">
          <span class="material-symbols-outlined" style="font-size:13px;">check_circle</span>
          ${statusLabel}
        </span>
        ${time ? `<span style="color:#64748b;">• ${time}</span>` : ''}
        ${sos.responder_name ? `<span style="color:#94a3b8;">• ${sos.responder_name}</span>` : ''}
      </div>
      ${acceptBtn}
    </div>`;
  }

  toggleWindyPanel() {
    this.showWindyPanel = !this.showWindyPanel;
  }

  toggleWindy() {
    this.showWindy = !this.showWindy;
    if (this.showWindy) {
      this.windyLoaded = true;
      // Giữ bảng mở để hiện thêm tùy chọn layer
    } else {
      this.windyLoaded = false;
      this.showWindyPanel = false; // ← tắt windy thì đóng bảng luôn
    }
  }

  toggleFloodZone() {
    this.showFloodZone = !this.showFloodZone;
    if (this.showFloodZone) this.floodLayers.forEach((l) => l.addTo(this.map));
    else this.floodLayers.forEach((l) => l.remove());
  }

  getWindyUrl(): string {
    return `https://embed.windy.com/embed2.html?lat=16&lon=108&zoom=5&level=surface&overlay=${this.selectedWindyLayer}&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=16&detailLon=108&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
  }

  selectWindyLayer(key: string) {
    this.selectedWindyLayer = key;
  }

  locateMe() {
    setTimeout(() => {
      this.locating = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.locating = false;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.userLat = +lat.toFixed(6);
          this.userLng = +lng.toFixed(6);
          this.getLocationName(lat, lng);

          if (!this.map) return;

          try {
            if (this.userMarker) this.userMarker.remove();
            const icon = L.divIcon({
              className: '',
              html: `<div style="width:14px;height:14px;border-radius:50%;background:#4285f4;border:2px solid white;box-shadow:0 0 0 6px rgba(66,133,244,0.2),0 2px 6px rgba(0,0,0,0.3);"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            });
            this.userMarker = L.marker([lat, lng], { icon }).addTo(this.map);
            this.map.setView([lat, lng], 15);
            this.cdr.detectChanges();
          } catch (e) {
            // Map đã bị destroy
          }
        },
        (err) => {
          this.locating = false;
          this.cdr.detectChanges();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    }, 0);
  }

  getUrgencyLabel(level: string): string {
    const map: Record<string, string> = {
      critical: 'Cực kỳ nguy hiểm',
      high: 'Nghiêm trọng',
      medium: 'Trung bình',
      low: 'Nhẹ',
    };
    return map[level] || level;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Chờ xử lý',
      assigned: 'Đang xử lý',
      in_progress: 'Đang xử lý',
      resolved: 'Đã cứu',
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      in_progress: 'status-inprogress',
      assigned: 'status-inprogress',
      resolved: 'status-resolved',
    };
    return map[status] || '';
  }

  getSeverityLabel(severity: string): string {
    const map: Record<string, string> = {
      critical: 'KHẨN CẤP',
      danger: 'NGUY HIỂM',
      warning: 'ĐANG THEO DÕI',
      info: 'TƯ VẤN',
    };
    return map[severity] || severity;
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = {
      critical: 'alert-critical',
      danger: 'alert-danger',
      warning: 'alert-warning',
      info: 'alert-info',
    };
    return map[severity] || '';
  }

  getSeverityIcon(severity: string): string {
    const map: Record<string, string> = {
      critical: 'tsunami',
      danger: 'waves',
      warning: 'thunderstorm',
      info: 'rainy',
    };
    return map[severity] || 'warning';
  }

  getRiskLabel(): string {
    const map: Record<string, string> = {
      safe: 'AN TOÀN',
      warning: 'CẢNH BÁO',
      danger: 'NGUY HIỂM',
      critical: 'KHẨN CẤP',
    };
    return map[this.riskLevel];
  }

  getRiskIcon(): string {
    const map: Record<string, string> = {
      safe: 'verified_user',
      warning: 'warning',
      danger: 'dangerous',
      critical: 'emergency',
    };
    return map[this.riskLevel];
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  // Lắng nghe event nhận nhiệm vụ từ popup
  ngAfterViewInit_extra() {
    window.addEventListener('accept-sos', (e: any) => {
      this.acceptTask(e.detail);
    });
  }
}
