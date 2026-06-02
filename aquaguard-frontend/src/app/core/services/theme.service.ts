import { Injectable } from '@angular/core';

export type Theme = 'dark' | 'light' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private current: Theme = 'dark';

  init() {
    const saved = (localStorage.getItem('theme') as Theme) || 'dark';
    this.apply(saved);
  }

  apply(theme: Theme) {
    this.current = theme;
    localStorage.setItem('theme', theme);

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(isDark ? 'theme-dark' : 'theme-light');
  }

  applyAuthTheme() {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add('theme-dark'); // auth page luôn dark
  }

  getTheme(): Theme {
    return this.current;
  }
}
