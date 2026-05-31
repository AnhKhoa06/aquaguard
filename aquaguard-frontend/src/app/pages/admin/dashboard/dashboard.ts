import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import * as L from 'leaflet';
import { SosService } from '../../../core/services/sos.service';
import { UserService } from '../../../core/services/user.service';
import { FloodService } from '../../../core/services/flood.service';
import { SafePipe } from '../../../core/pipes/safe.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SafePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  activeTab: 'overview' | 'users' | 'teams' | 'map' = 'overview';
  loading = true;
  stats: any = null;
  // Users
  users: any[] = [];
  usersLoading = false;
  userQuery = '';
  private apiUrl = environment.apiUrl;
  roleFilter = '';

  // Map
  private map!: L.Map;
  private mapInitialized = false;
  private sosMarkers: L.Marker[] = [];
  private floodLayers: any[] = [];
  showFloodZone = false;

  //windy
  showWindyPanel = false;
  showWindy = false;
  windyLoaded = false;
  selectedWindyLayer = 'rain';

  windyLayers = [
    { key: 'rain', label: 'Mưa', icon: 'grain' },
    { key: 'wind', label: 'Gió', icon: 'air' },
    { key: 'clouds', label: 'Mây', icon: 'cloud' },
    { key: 'temp', label: 'Nhiệt độ', icon: 'thermometer' },
    { key: 'pressure', label: 'Áp suất', icon: 'speed' },
    { key: 'waves', label: 'Sóng biển', icon: 'waves' },
  ];

  constructor(
    private http: HttpClient,
    private sosService: SosService,
    private floodService: FloodService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  loadDashboard() {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/admin/dashboard`).subscribe({
      next: (res) => {
        if (res.success) this.stats = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // ===== Users =====
  setTab(tab: 'overview' | 'users' | 'teams' | 'map') {
    // Nếu đang ở tab map mà chuyển sang tab khác → destroy map
    if (this.activeTab === 'map' && tab !== 'map') {
      if (this.map) {
        this.map.remove();
        this.mapInitialized = false;
      }
    }

    this.activeTab = tab;

    if (tab === 'map') {
      setTimeout(() => this.initMap(), 100);
    }

    if (tab === 'users') {
      this.loadUsers();
    }
  }

  get filteredUsers() {
    return this.users.filter((u) => {
      if (u.role === 'admin') return false; // ← ẩn admin
      const matchQuery =
        !this.userQuery ||
        (u.full_name || '').toLowerCase().includes(this.userQuery.toLowerCase()) ||
        (u.phone || '').includes(this.userQuery);
      const matchRole = !this.roleFilter || u.role === this.roleFilter;
      return matchQuery && matchRole;
    });
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

  loadUsers() {
    this.usersLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.users = res.data || [];
          console.log('user sample:', this.users[0]); // ← thêm dòng này
        }
        this.usersLoading = false;
      },
      error: () => (this.usersLoading = false),
    });
  }

  onChangeRole(u: any, role: any) {
    if (u.role === 'admin') {
      alert('Không thể thay đổi role của Admin!');
      return;
    }
    if (role === 'admin') {
      alert('Không thể cấp quyền Admin qua giao diện!');
      return;
    }
    const prev = u.role;
    u.role = role;
    this.userService.updateRole(u.id, role).subscribe({
      next: (res) => {
        // success
      },
      error: () => {
        u.role = prev; // rollback
      },
    });
  }

  onDeleteUser(u: any) {
    if (!confirm(`Xoá người dùng "${u.full_name || u.phone}"?`)) return;
    this.userService.deleteUser(u.id).subscribe({
      next: (res) => {
        this.users = this.users.filter((x) => x.id !== u.id);
      },
      error: () => alert('Xoá không thành công'),
    });
  }

  private initMap() {
    if (this.mapInitialized) return;
    this.mapInitialized = true;

    this.map = L.map('admin-map', {
      //tìm element có id="admin-map"
      center: [16.047, 108.206], //tọa độ trung tâm ban đầu (Đà Nẵng)
      zoom: 6,
      zoomControl: false,
    });

    L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps',
      maxZoom: 20,
    }).addTo(this.map); //lấy tile (ảnh bản đồ) từ Google Maps

    L.control.zoom({ position: 'topleft' }).addTo(this.map);

    this.loadSosMarkers();
    this.loadFloodData();
  }

  private loadSosMarkers() {
    this.sosService.getActive().subscribe({
      next: (res) => {
        if (res.success) {
          const list = res.data.filter((s: any) => s.latitude && s.longitude);
          list.forEach((sos: any) => {
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
            const ringHtml = isPending
              ? `<div style="position:absolute;top:0;left:0;width:44px;height:44px;border-radius:50%;border:2.5px solid #ef4444;animation:sos-pulse 1.8s ease-out infinite;pointer-events:none;"></div>`
              : '';

            const icon = L.divIcon({
              className: '',
              html: `
                <style>@keyframes sos-pulse{0%{transform:scale(0.75);opacity:1;}70%{transform:scale(1.75);opacity:0;}100%{transform:scale(0.75);opacity:0;}}</style>
                <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
                  ${ringHtml}
                  <div style="position:relative;z-index:1;width:40px;height:40px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
                    <span style="color:#fff;font-size:13px;font-weight:700;">${initials}</span>
                  </div>
                </div>`,
              iconSize: [44, 44],
              iconAnchor: [22, 22],
              popupAnchor: [0, -26],
            });

            L.marker([sos.latitude, sos.longitude], { icon })
              .addTo(this.map)
              .bindPopup(
                `<div style="padding:10px;font-family:inherit;min-width:180px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#f1f5f9;">${name}</p>
                ${sos.address ? `<p style="margin:0;font-size:11px;color:#64748b;">${sos.address}</p>` : ''}
              </div>`,
                { className: 'sos-popup-wrap', maxWidth: 280 },
              );
          });
        }
      },
    });
  }

  private loadFloodData() {
    this.floodService.getFloodData().subscribe({
      next: (res) => {
        if (res.success) {
          res.data.forEach((point: any) => {
            const color: Record<string, string> = {
              critical: '#ef4444',
              high: '#f97316',
              moderate: '#f59e0b',
              safe: '#22c55e',
            };
            const c = color[point.risk_level] || '#64748b';
            const icon = L.divIcon({
              className: '',
              html: `<div style="
                width: 24px;
                height: 24px;
                border-radius: 50% 50% 50% 0;
                background: ${c};
                transform: rotate(-45deg);
                border: 2px solid white;
              ">
                <div style="
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  background: white;
                  transform: rotate(45deg);
                  margin: 6px auto 0;
                "></div>
              </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 24],
            });
            const marker = L.marker([point.latitude, point.longitude], { icon })
              .bindTooltip(point.risk_level)
              .addTo(this.map);
            this.floodLayers.push(marker as any);
          });
          this.showFloodZone = true;
        }
      },
    });
  }

  toggleFloodZone() {
    this.showFloodZone = !this.showFloodZone;
    if (this.showFloodZone) this.floodLayers.forEach((l) => l.addTo(this.map));
    else this.floodLayers.forEach((l) => l.remove());
  }

  // ===== WINDY =====
  toggleWindyPanel() {
    this.showWindyPanel = !this.showWindyPanel;
    if (!this.showWindyPanel) {
      this.showWindy = false;
      this.windyLoaded = false;
    }
  }

  toggleWindy() {
    this.showWindy = !this.showWindy;
    console.log('showWindy:', this.showWindy);
    if (this.showWindy) {
      this.windyLoaded = true;
      console.log('windyLoaded:', this.windyLoaded);
      console.log('windyUrl:', this.getWindyUrl());
    } else {
      this.windyLoaded = false;
    }
  }

  selectWindyLayer(key: string) {
    this.selectedWindyLayer = key;
  }

  getWindyUrl(): string {
    return `https://embed.windy.com/embed2.html?lat=16&lon=108&zoom=5&level=surface&overlay=${this.selectedWindyLayer}&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=16&detailLon=108&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['var(--primary)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[name.charCodeAt(0) % colors.length];
  }
}
