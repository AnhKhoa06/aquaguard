import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  currentStep = 1;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  selectedGender = '';
  selectedRole = 'citizen';
  rolePassword = '';

  step1Form: FormGroup;
  step2Form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
  ) {
    this.step1Form = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['+84', [Validators.required, Validators.minLength(9)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.step2Form = this.fb.group({
      date_of_birth: ['', Validators.required],
    });
  }

  get full_name() {
    return this.step1Form.get('full_name');
  }
  get phone() {
    return this.step1Form.get('phone');
  }
  get password() {
    return this.step1Form.get('password');
  }
  get date_of_birth() {
    return this.step2Form.get('date_of_birth');
  }

  selectGender(gender: string) {
    this.selectedGender = gender;
  }

  selectRole(role: string) {
    this.selectedRole = role;
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.step1Form.invalid) {
        this.step1Form.markAllAsTouched();
        return;
      }
    }
    if (this.currentStep === 2) {
      if (!this.selectedGender) {
        this.errorMessage = 'Vui lòng chọn giới tính!';
        return;
      }
      if (this.step2Form.invalid) {
        this.step2Form.markAllAsTouched();
        return;
      }
    }
    this.errorMessage = '';
    this.currentStep++;
  }

  prevStep() {
    this.errorMessage = '';
    this.currentStep--;
  }

  onRegister() {
    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      full_name: this.step1Form.value.full_name,
      phone: this.step1Form.value.phone,
      password: this.step1Form.value.password,
      gender: this.selectedGender,
      date_of_birth: this.step2Form.value.date_of_birth,
      role: this.selectedRole,
      role_password: this.rolePassword,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('Tài khoản đã được tạo thành công!', 'Thành công');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Đăng ký thất bại!';
        this.toastr.error(this.errorMessage, 'Lỗi');
      },
    });
  }

  getGenderLabel(): string {
    const map: any = { male: 'Nam', female: 'Nữ', other: 'Khác' };
    return map[this.selectedGender] || '';
  }
}
