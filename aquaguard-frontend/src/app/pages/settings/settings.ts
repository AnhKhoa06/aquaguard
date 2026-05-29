import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/interfaces';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FamilyService } from '../../core/services/family.service';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { ActivatedRoute } from '@angular/router';

type Tab = 'profile' | 'family' | 'theme' | 'language';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss'],
})
export class SettingsComponent implements OnInit {
  activeTab: Tab = 'profile';
  loading = false;
  saving = false;
  locating = false;
  age: number | null = null;
  showAddMember = false;
  private isSaving = false;
  selectedTheme: Theme = 'dark';

  familyMembers: User[] = [];
  loadingFamily = false;
  addingMember = false;
  newMemberPhone = '';
  selectedHealth: string = '';

  profile = {
    full_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    gender: '',
    date_of_birth: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
  };

  currentUser: User | null = null;

  tabs: { key: Tab; label: string; icon: string }[] = [];

  constructor(
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private familyService: FamilyService,
    private themeService: ThemeService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.selectedHealth = this.currentUser?.health_status || 'unknown';
    this.buildTabs();
    this.loadProfile();
    this.loadFamily();
    this.selectedTheme = this.themeService.getTheme();

    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.activeTab = params['tab'] as Tab;
      }
    });
  }

  loadProfile() {
    if (this.isSaving) return;
    this.loading = true;

    // Lấy từ localStorage trước cho nhanh
    const cached = this.authService.getCurrentUser();
    if (cached) {
      this.mapUserToProfile(cached);
      this.selectedHealth = cached.health_status || 'unknown';
    }

    // Sau đó gọi API lấy data mới nhất
    this.userService.getProfile().subscribe({
      next: (res) => {
        if (res.success) {
          this.mapUserToProfile(res.data);
          this.currentUser = res.data;
          this.selectedHealth = res.data.health_status || 'unknown';

          // Chỉ lấy vị trí khi chưa có địa chỉ
          const isCoords = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(this.profile.address);
          if (!this.profile.address || isCoords) {
            this.getLocation();
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  mapUserToProfile(user: User) {
    this.profile.full_name = user.full_name || '';
    this.profile.email = user.email || '';
    this.profile.phone = user.phone || '';
    this.profile.emergency_contact = (user as any).emergency_contact || '';
    this.profile.gender = user.gender || '';
    this.profile.date_of_birth = user.date_of_birth || '';
    this.profile.address = (user as any).address || '';
    this.profile.latitude = user.latitude || null;
    this.profile.longitude = user.longitude || null;
    this.calcAge();
  }
  setHealth(status: string) {
    this.selectedHealth = status;
  }
  setTab(tab: Tab) {
    this.activeTab = tab;
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      citizen: 'Công dân',
      responder: 'Đội cứu hộ',
      admin: 'Quản trị viên',
    };
    return map[role] || 'Công dân';
  }

  buildTabs() {
    const role = this.currentUser?.role;
    this.tabs = [
      { key: 'profile' as Tab, label: 'Hồ sơ', icon: 'person' },
      ...(role === 'citizen' ? [{ key: 'family' as Tab, label: 'Gia đình', icon: 'group' }] : []),
      { key: 'theme' as Tab, label: 'Giao diện', icon: 'palette' },
      { key: 'language' as Tab, label: 'Ngôn ngữ', icon: 'translate' },
    ];
  }

  calcAge() {
    if (!this.profile.date_of_birth) return;
    const dob = new Date(this.profile.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    this.age = age;
  }

  onDobChange() {
    this.calcAge();
  }

  getInitial(): string {
    return this.profile.full_name?.charAt(0).toUpperCase() || '?';
  }

  getLocation() {
    if (!navigator.geolocation) return;
    this.locating = true;
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = parseFloat(pos.coords.latitude.toFixed(6));
      const lng = parseFloat(pos.coords.longitude.toFixed(6));

      console.log('getLocation called, lat:', lat, 'lng:', lng);
      console.log('current address:', this.profile.address);

      this.profile.latitude = lat;
      this.profile.longitude = lng;

      try {
        const res = await fetch(
          `http://localhost:3000/api/users/reverse-geocode?lat=${lat}&lng=${lng}`,
          { headers: { Authorization: `Bearer ${this.authService.getToken()}` } },
        );
        const data = await res.json();
        console.log('reverse-geocode response:', data);
        this.profile.address = data.address || `${lat}, ${lng}`;
      } catch (err) {
        console.log('reverse-geocode error:', err);
        if (!this.profile.address) this.profile.address = `${lat}, ${lng}`;
      }

      this.locating = false;
      this.cdr.detectChanges();
    });
  }

  saveProfile() {
    this.isSaving = true;
    this.saving = true;
    this.userService
      .updateProfile({
        full_name: this.profile.full_name,
        email: this.profile.email,
        gender: this.profile.gender as any,
        date_of_birth: this.profile.date_of_birth,
        address: this.profile.address,
        emergency_contact: this.profile.emergency_contact,
        latitude: this.profile.latitude ?? undefined,
        longitude: this.profile.longitude ?? undefined,
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success('Thông tin cá nhân đã được cập nhật!', 'Lưu thành công');
            // Cập nhật lại localStorage đúng cách
            const user = this.authService.getCurrentUser();
            if (user) {
              const updated = {
                ...user,
                full_name: this.profile.full_name,
                email: this.profile.email,
                phone: this.profile.phone,
                gender: this.profile.gender,
                date_of_birth: this.profile.date_of_birth,
                address: this.profile.address,
                emergency_contact: this.profile.emergency_contact,
                latitude: this.profile.latitude,
                longitude: this.profile.longitude,
              };
              localStorage.setItem('user', JSON.stringify(updated));
              this.authService['currentUserSubject'].next(updated as any);
            }
          } else {
            this.toastr.error(res.message || 'Có lỗi xảy ra!', 'Thất bại');
          }
          this.saving = false;
          this.isSaving = false; // ← thêm
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Không thể kết nối server!', 'Lỗi');
          this.saving = false;
          this.isSaving = false; // ← thêm
          this.cdr.detectChanges();
        },
      });
  }
  loadFamily() {
    this.loadingFamily = true;
    this.familyService.getFamily().subscribe({
      next: (res) => {
        if (res.success) this.familyMembers = res.data;
        this.loadingFamily = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingFamily = false;
        this.cdr.detectChanges();
      },
    });
  }

  addMember() {
    if (!this.newMemberPhone.trim()) return;
    this.addingMember = true;
    this.familyService.addMember(this.newMemberPhone.trim()).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã thêm người thân!', 'Thành công');
          this.newMemberPhone = '';
          this.loadFamily();
        } else {
          this.toastr.error(res.message || 'Không tìm thấy người dùng!', 'Thất bại');
        }
        this.addingMember = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Không thể kết nối server!', 'Lỗi');
        this.addingMember = false;
        this.cdr.detectChanges();
      },
    });
  }

  removeMember(memberId: number) {
    this.familyService.removeMember(memberId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Đã xóa người thân!', 'Thành công');
          this.loadFamily();
        } else {
          this.toastr.error(res.message || 'Có lỗi xảy ra!', 'Thất bại');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Không thể kết nối server!', 'Lỗi');
        this.cdr.detectChanges();
      },
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

  getMemberInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }

  setTheme(theme: Theme) {
    this.selectedTheme = theme;
    this.themeService.apply(theme);
  }
}
