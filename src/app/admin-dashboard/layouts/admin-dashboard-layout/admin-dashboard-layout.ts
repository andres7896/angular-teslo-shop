import { AuthApi } from '@/auth/services/auth/auth-api';
import { ThemeToggle } from '@/shared/components/theme-toggle/theme-toggle';
import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ThemeToggle
],
  templateUrl: './admin-dashboard-layout.html',
})
export class AdminDashboardLayout {

  authService = inject(AuthApi);

  user = computed(() => this.authService.user());
}
