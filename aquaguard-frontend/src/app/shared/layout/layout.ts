import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/interfaces';

interface NavItem {
  icon: string;
  labelVi: string;
  labelEn: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: User | null = null;
  collapsed = false;
  currentLang = 'VI';

  navItems: NavItem[] = [];

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    // Nếu null thì lấy từ localStorage
    if (!this.currentUser) {
      const stored = localStorage.getItem('user');
      if (stored) this.currentUser = JSON.parse(stored);
    }

    this.buildNav();
  }

  buildNav() {
    const role = this.currentUser?.role;
    if (role === 'citizen') {
      this.navItems = [
        {
          icon: 'dashboard',
          labelVi: 'Bảng điều khiển',
          labelEn: 'Dashboard',
          route: '/citizen/dashboard',
        },
        { icon: 'map', labelVi: 'Bản đồ lũ lụt', labelEn: 'Flood Map', route: '/citizen/map' },
        { icon: 'sos', labelVi: 'Yêu cầu SOS', labelEn: 'SOS Request', route: '/citizen/sos' },
        {
          icon: 'security',
          labelVi: 'Quy trình an toàn',
          labelEn: 'Safety Guide',
          route: '/citizen/safety',
        },
      ];
    } else if (role === 'admin') {
      this.navItems = [
        {
          icon: 'admin_panel_settings',
          labelVi: 'Quản trị viên',
          labelEn: 'Admin',
          route: '/admin/dashboard',
        },
        { icon: 'sos', labelVi: 'Yêu cầu SOS', labelEn: 'SOS Requests', route: '/admin/sos' },
        {
          icon: 'sensors',
          labelVi: 'Cảm biến lũ',
          labelEn: 'Flood Sensors',
          route: '/admin/sensors',
        },
        {
          icon: 'analytics',
          labelVi: 'Phân tích hệ thống',
          labelEn: 'Analytics',
          route: '/admin/analytics',
        },
      ];
    } else if (role === 'responder') {
      this.navItems = [
        { icon: 'map', labelVi: 'Bản đồ lũ lụt', labelEn: 'Flood Map', route: '/responder/map' },
        {
          icon: 'emergency',
          labelVi: 'Yêu cầu cứu hộ',
          labelEn: 'Rescue Requests',
          route: '/responder/tasks',
        },
        {
          icon: 'task',
          labelVi: 'Nhiệm vụ của tôi',
          labelEn: 'My Tasks',
          route: '/responder/my-tasks',
        },
        { icon: 'groups', labelVi: 'Đội cứu hộ', labelEn: 'Rescue Team', route: '/responder/team' },
      ];
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      citizen: 'Công dân',
      responder: 'Đội cứu hộ',
      admin: 'Quản trị viên hệ thống',
    };
    return map[role] || role;
  }

  getRoleLabelEn(role: string): string {
    const map: Record<string, string> = {
      citizen: 'Citizen',
      responder: 'Rescue Team',
      admin: 'System Admin',
    };
    return map[role] || role;
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  toggleLang() {
    this.currentLang = this.currentLang === 'VI' ? 'EN' : 'VI';
    const lang = this.currentLang.toLowerCase();
    document.querySelectorAll('[data-vi]').forEach((el: any) => {
      el.textContent = el.getAttribute(`data-${lang}`);
    });
  }

  getLogoSrc(): string {
    // Kiểm tra theme hiện tại
    const isLight = document.body.classList.contains('theme-light');
    return isLight ? '/logo-light.png' : '/logo.png';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
