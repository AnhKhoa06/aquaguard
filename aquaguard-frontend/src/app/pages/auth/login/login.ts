import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
  ) {
    this.loginForm = this.fb.group({
      phone: ['+84', [Validators.required, Validators.minLength(9)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get phone() {
    return this.loginForm.get('phone');
  }
  get password() {
    return this.loginForm.get('password');
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { phone, password } = this.loginForm.value;

    this.authService.login(phone, password).subscribe({
      next: (res) => {
        this.isLoading = false;
        const role = res.data.user.role;

        if (role === 'admin') this.router.navigate(['/admin']);
        else if (role === 'responder') this.router.navigate(['/responder']);
        else this.router.navigate(['/citizen']);

        this.toastr.success('Đăng nhập thành công!', 'Thành công');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Đăng nhập thất bại!';
        this.toastr.error('Số điện thoại hoặc mật khẩu không đúng!', 'Lỗi');
      },
    });
  }
}
