import { AuthApi } from '@/auth/services/auth/auth-api';
import { ThemeToggle } from '@/shared/components/theme-toggle/theme-toggle';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'front-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    ThemeToggle
  ],
  templateUrl: './front-navbar.html',
})
export class FrontNavbar {

  authService = inject(AuthApi);
}
