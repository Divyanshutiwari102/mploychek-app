import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading   = false;
  error     = '';
  showPass  = false;

  // Quick-fill presets so evaluators can easily test both roles
  presets = [
    { label: 'Admin',        userId: 'admin@mploychek.com',    role: 'Admin' },
    { label: 'General User', userId: 'divyanshu@mploychek.com', role: 'General User' }
  ];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn) this.router.navigate(['/dashboard']);

    this.loginForm = this.fb.group({
      userId:   ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role:     ['General User', Validators.required]
    });
  }

  fillPreset(preset: { userId: string; role: string }): void {
    this.loginForm.patchValue({ userId: preset.userId, password: 'password123', role: preset.role });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    const { userId, password } = this.loginForm.value;
    this.auth.login({ userId, password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error   = err.error?.message || 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  get f() { return this.loginForm.controls; }
}
