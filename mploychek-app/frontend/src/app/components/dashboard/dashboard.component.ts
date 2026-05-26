import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService }  from '../../services/auth.service';
import { UserService }  from '../../services/user.service';
import { User, VerificationRecord } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user!: User;
  records: VerificationRecord[] = [];
  filteredRecords: VerificationRecord[] = [];

  loadingRecords = false;
  loadingProfile = false;
  recordsError   = '';

  // Async delay demo
  delayMs      = 0;
  loadStartTime = 0;
  actualLoadMs  = 0;
  showDelayInfo = false;

  // Filters
  searchTerm   = '';
  statusFilter = '';
  typeFilter   = '';

  // Stats
  stats = { total: 0, verified: 0, pending: 0, failed: 0 };

  private destroy$ = new Subject<void>();

  constructor(
    public  auth: AuthService,
    private userSvc: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser!;
    this.loadProfile();
    this.loadRecords();
  }

  loadProfile(): void {
    this.loadingProfile = true;
    this.userSvc.getMe().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingProfile = false)
    ).subscribe({ next: u => this.user = u });
  }

  loadRecords(): void {
    this.loadingRecords = true;
    this.recordsError   = '';
    this.showDelayInfo  = false;
    this.loadStartTime  = performance.now();

    this.userSvc.getRecords(this.delayMs).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loadingRecords = false;
        this.actualLoadMs   = Math.round(performance.now() - this.loadStartTime);
        this.showDelayInfo  = true;
      })
    ).subscribe({
      next: (res) => {
        this.records = res.records;
        this.applyFilters();
        this.computeStats();
      },
      error: () => this.recordsError = 'Failed to load records. Please try again.'
    });
  }

  applyFilters(): void {
    this.filteredRecords = this.records.filter(r => {
      const matchSearch = !this.searchTerm ||
        r.candidateName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.company.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.statusFilter || r.status === this.statusFilter;
      const matchType   = !this.typeFilter   || r.verificationType === this.typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }

  computeStats(): void {
    this.stats = {
      total:    this.records.length,
      verified: this.records.filter(r => r.status === 'Verified').length,
      pending:  this.records.filter(r => r.status === 'Pending' || r.status === 'In Progress').length,
      failed:   this.records.filter(r => r.status === 'Failed').length
    };
  }

  clearFilters(): void {
    this.searchTerm = ''; this.statusFilter = ''; this.typeFilter = '';
    this.applyFilters();
  }

  badgeClass(status: string): string {
    const map: Record<string, string> = {
      'Verified':    'badge-success',
      'Pending':     'badge-warning',
      'In Progress': 'badge-info',
      'Failed':      'badge-danger'
    };
    return map[status] || 'badge-info';
  }

  riskClass(risk: string): string {
    return { Low: 'badge-success', Medium: 'badge-warning', High: 'badge-danger' }[risk] || '';
  }

  logout(): void { this.auth.logout(); }

  goAdmin(): void { this.router.navigate(['/admin']); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
