import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { RescueTeamService } from '../../../core/services/rescue-team.service';
import 'leaflet.markercluster';

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

  // Teams
  teams: any[] = [];
  teamsLoading = false;
  selectedTeamId: number | null = null;
  joinRequests: any[] = [];
  showCreateTeam = false;
  newTeam = { name: '', phone: '', area: '' };
  addMemberUserId: number | null = null;
  responders: any[] = [];

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
    private rescueTeamService: RescueTeamService,
    private cdr: ChangeDetectorRef,
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

    if (tab === 'teams') {
      this.loadTeams();
      this.loadJoinRequests();
      this.loadResponders();
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

  loadTeams(): void {
    this.teamsLoading = true;
    this.rescueTeamService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.teams = res.data;
          if (this.teams.length > 0 && !this.selectedTeamId) {
            this.selectedTeamId = this.teams[0].id;
          }
        }
        this.teamsLoading = false;
      },
      error: () => {
        this.teamsLoading = false;
      },
    });
  }

  loadJoinRequests(): void {
    this.rescueTeamService.getJoinRequests().subscribe({
      next: (res) => {
        if (res.success) this.joinRequests = res.data;
      },
    });
  }

  loadResponders(): void {
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.responders = res.data.filter((u: any) => u.role === 'responder');
        }
      },
    });
  }

  get selectedTeam(): any {
    return this.teams.find((t) => t.id === this.selectedTeamId) || null;
  }

  createTeam(): void {
    if (!this.newTeam.name) return;
    this.rescueTeamService.createTeam(this.newTeam).subscribe({
      next: (res) => {
        if (res.success) {
          this.showCreateTeam = false;
          this.newTeam = { name: '', phone: '', area: '' };
          this.loadTeams();
        }
      },
    });
  }

  addMember(): void {
    if (!this.selectedTeamId || !this.addMemberUserId) return;
    this.rescueTeamService.addMember(this.selectedTeamId, this.addMemberUserId).subscribe({
      next: (res) => {
        if (res.success) {
          this.addMemberUserId = null;
          this.loadTeams();
        }
      },
    });
  }

  deleteTeam(teamId: number): void {
    if (!confirm('Xoá đội cứu hộ này?')) return;
    this.rescueTeamService.deleteTeam(teamId).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedTeamId = null;
          this.loadTeams();
        }
      },
    });
  }

  handleJoinRequest(requestId: number, status: 'approved' | 'rejected'): void {
    this.rescueTeamService.handleJoinRequest(requestId, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadJoinRequests();
          this.loadTeams();
        }
      },
    });
  }

  getMemberName(userId: number): string {
    const user = this.responders.find((u) => u.id === userId);
    return user ? user.full_name : `User #${userId}`;
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
    this.sosService.getAllForMap().subscribe({
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
            const ringColor = colorMap[sos.status] ?? '#ef4444';

            const statusLabelMap: Record<string, string> = {
              pending: 'Chờ xử lý',
              assigned: 'Đang xử lý',
              in_progress: 'Đang xử lý',
              resolved: 'Đã cứu',
            };
            const statusLabel = statusLabelMap[sos.status] ?? sos.status;

            const ringHtml =
              sos.status === 'pending'
                ? `<div style="position:absolute;top:-3px;left:-3px;width:50px;height:50px;border-radius:50%;border:2.5px solid ${ringColor};animation:sos-pulse 1.8s ease-out infinite;pointer-events:none;"></div>`
                : `<div style="position:absolute;top:-3px;left:-3px;width:50px;height:50px;border-radius:50%;border:2.5px solid ${ringColor};pointer-events:none;"></div>`;

            const icon = L.divIcon({
              className: '',
              html: `
              <style>@keyframes sos-pulse{0%{transform:scale(0.75);opacity:1;}70%{transform:scale(1.75);opacity:0;}100%{transform:scale(0.75);opacity:0;}}</style>
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
                  ${ringHtml}
                  <div style="position:relative;z-index:1;width:40px;height:40px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
                    <span style="color:#fff;font-size:13px;font-weight:700;">${initials}</span>
                  </div>
                </div>
                <div style="background:${bg};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);">
                  ${statusLabel}
                </div>
              </div>`,
              iconSize: [44, 44],
              iconAnchor: [22, 22],
              popupAnchor: [0, -26],
            });

            const urgencyMap: Record<string, string> = {
              critical: 'Cực kỳ nguy hiểm',
              high: 'Nghiêm trọng',
              medium: 'Trung bình',
              low: 'Nhẹ',
            };
            const statusColorMap: Record<string, string> = {
              pending: '#ef4444',
              assigned: '#f59e0b',
              in_progress: '#f59e0b',
              resolved: '#22c55e',
            };
            const sColor = statusColorMap[sos.status] ?? '#64748b';
            const avatarColor = (colorMap[sos.status] ?? '#ef4444').replace('#', '');
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${avatarColor}&color=fff&size=40`;
            const time = sos.created_at
              ? new Date(sos.created_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '';

            L.marker([sos.latitude, sos.longitude], { icon })
              .addTo(this.map)
              .bindPopup(
                `
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
              </div>`,
                { className: 'sos-popup-wrap', maxWidth: 320, minWidth: 250 },
              );
          });
        }
      },
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
                iconAnchor: [12, 16],
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
                  iconAnchor: [16, 21],
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

  toggleFloodZone() {
    this.showFloodZone = !this.showFloodZone;
    if (this.showFloodZone) this.floodLayers.forEach((l) => l.addTo(this.map));
    else this.floodLayers.forEach((l) => l.remove());
  }

  // ===== WINDY =====
  toggleWindyPanel() {
    this.showWindyPanel = !this.showWindyPanel; // ← toggle bình thường luôn
  }

  toggleWindy() {
    this.showWindy = !this.showWindy;
    if (this.showWindy) {
      this.windyLoaded = true;
    } else {
      this.windyLoaded = false;
      this.showWindyPanel = false; // ← chỉ đóng bảng khi tắt windy
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
