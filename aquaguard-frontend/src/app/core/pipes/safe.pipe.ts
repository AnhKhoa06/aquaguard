// src/app/core/pipes/safe.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safe', standalone: true })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

//Nó sử dụng dịch vụ DomSanitizer của Angular để bỏ qua cơ chế chặn
// bảo mật đối với các URL tài nguyên bên ngoài.
// Pipe này cực kỳ hữu ích khi hệ thống của chúng ta cần nhúng các iframe như
// Bản đồ vị trí cứu hộ (Google Maps) hoặc các tài nguyên media bên ngoài vào
// ứng dụng mà không bị Angular chặn lại
