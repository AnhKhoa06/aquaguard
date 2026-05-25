import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  currentLang = 'VI';

  toggleLang() {
    this.currentLang = this.currentLang === 'VI' ? 'EN' : 'VI';
    const lang = this.currentLang.toLowerCase();
    document.querySelectorAll('[data-vi]').forEach((el: any) => {
      el.textContent = el.getAttribute(`data-${lang}`);
    });
  }
}
