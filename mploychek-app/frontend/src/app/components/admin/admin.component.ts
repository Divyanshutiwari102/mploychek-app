import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/models';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading       = false;
  formLoading   = false;
  error         = '';
  successMsg    = '';

  showModal     = false;
  modalMode: ModalMode = 'create';
  selectedUser: User | null = null;

  showDeleteConfirm = false;
  deleteTarget: User | null = null;
  deleteLoading = false;

  userForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public  auth: AuthService,
    private userSvc: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadUsers();
  }

  buildForm(user?: User): void {
    this.userForm = this.fb.group({
      name:       [user?.name || '',        [Validators.required, Validators.minLength(2)]],
      userId:     [user?.userId || '',      [Validators.required, Validators.email]],
      password:   ['',                       this.modalMode === 'create'
                                              ? [Validators.required, Validators.minLength(6)]
                                              : []],
      role:       [user?.role || 'General User', Validators.required],
      department: [user?.department || '',   Validators.required],
      status:     [user?.status || 'Active', Validators.required]
    });

    // Disable userId field when editing
    if (this.modalMode === 'edit') {
      this.userForm.get('userId')?.disable();
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.userSvc.getAllUsers().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next:  users => this.users = users,
      error: () => this.error = 'Failed to load users.'
    });
  }

  // ── Open Modals ────────────────────────────────────────────────
  openCreate(): void {
    this.modalMode = 'create';
    this.selectedUser = null;
    this.buildForm();
    this.showModal = true;
  }

  openEdit(user: User): void {
    this.modalMode = 'edit';
    this.selectedUser = user;
    this.buildForm(user);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
    this.successMsg = '';
  }

  // ── Submit Form ────────────────────────────────────────────────
  onSubmit(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.formLoading = true;
    this.error = '';

    const raw = this.userForm.getRawValue();

    if (this.modalMode === 'create') {
      this.userSvc.createUser(raw).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.formLoading = false)
      ).subscribe({
        next: () => { this.loadUsers(); this.closeModal(); this.flash('User created successfully!'); },
        error: (e) => this.error = e.error?.message || 'Failed to create user.'
      });
    } else {
      const payload: Partial<User & { password?: string }> = {
        name: raw.name, role: raw.role, department: raw.department, status: raw.status
      };
      if (raw.password) payload['password'] = raw.password;

      this.userSvc.updateUser(this.selectedUser!.id, payload).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.formLoading = false)
      ).subscribe({
        next: () => { this.loadUsers(); this.closeModal(); this.flash('User updated successfully!'); },
        error: (e) => this.error = e.error?.message || 'Failed to update user.'
      });
    }
  }

  // ── Delete ─────────────────────────────────────────────────────
  confirmDelete(user: User): void {
    this.deleteTarget = user;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void { this.showDeleteConfirm = false; this.deleteTarget = null; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.deleteLoading = true;
    this.userSvc.deleteUser(this.deleteTarget.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.deleteLoading = false; this.cancelDelete(); })
    ).subscribe({
      next: () => { this.loadUsers(); this.flash('User deleted.'); },
      error: (e) => this.error = e.error?.message || 'Failed to delete user.'
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  private flash(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3500);
  }

  isSelf(user: User): boolean { return user.id === this.auth.currentUser?.id; }

  get f() { return this.userForm.controls; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
