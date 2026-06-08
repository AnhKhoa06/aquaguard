import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Interceptor:', req.method, req.url);
  const authService = inject(AuthService);
  const router = inject(Router);

  //Nhánh 1 (Đăng ký): Chưa có token → Gửi request gốc không kèm token (: req).
  //Nhánh 2 (Các tính năng bên trong app): Đã có token → Tạo bản sao kẹp token vào Header (req.clone(...))
  //rồi mới gửi đi.
  const token = authService.getToken(); //lấy token từ localStorage

  const cloned = token
    ? req.clone({
        //tạo bản sao request
        headers: req.headers.set('Authorization', `Bearer ${token}`), //kẹp token vào
      })
    : req; //không có token thì giữ nguyên request gốc không kèm token

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthRequest =
        req.url.includes('/auth/refresh-token') || req.url.includes('/auth/logout');

      //Biến isAuthRequest sẽ trả về true nếu request bị lỗi chính là
      // API refresh-token hoặc API đx(logout)
      //Lỗi 401 unauthorized token hết hạn hoặc không hợp lệ

      if (err.status === 401 && !isAuthRequest) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            //nhận token mới từ res
            const newToken = res.data.accessToken;
            const retried = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`), //tạo ra một bản sao
              // request mới
            });
            return next(retried);
          }),
          catchError(() => {
            authService.logout(); //để xóa sạch mọi token hết hạn ra khỏi máy
            router.navigate(['/auth/login']);
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err); //(500, 404...)
    }),
  );
};

//Nhờ có đoạn switchMap này, người dùng đang dùng app sẽ không hề thấy màn hình bị lỗi
//hay bị văng ra ngoài.Hệ thống đã tự động:
// 1. Nhận lỗi 401 (Token hết hạn).
// 2. Đi xin Token mới (refreshToken).
// 3. Tạo request mới kẹp Token mới vào (switchMap).
// 4. Gửi lại request đó (next(retried)).
// Kết quả là dữ liệu vẫn hiển thị lên màn hình mượt mà như chưa từng có cuộc lỗi xảy ra.
