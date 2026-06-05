import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  currentLang = 'VI';

  constructor(
    public router: Router,
    private themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.themeService.init();

    this.router.events.subscribe(() => {
      if (this.router.url.startsWith('/auth')) {
        this.themeService.applyAuthTheme();
      }
    });
  }

  get isAuthPage(): boolean {
    return this.router.url.startsWith('/auth');
  }

  toggleLang() {
    this.currentLang = this.currentLang === 'VI' ? 'EN' : 'VI';
    const lang = this.currentLang.toLowerCase();
    document.querySelectorAll('[data-vi]').forEach((el: any) => {
      el.textContent = el.getAttribute(`data-${lang}`);
    });
  }
}
