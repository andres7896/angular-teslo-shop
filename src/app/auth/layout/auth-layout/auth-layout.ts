import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeToggle } from '@/shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, ThemeToggle],
  templateUrl: './auth-layout.html',
})
export class AuthLayout { }
