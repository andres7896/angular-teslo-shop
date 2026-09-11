import { Component, inject } from '@angular/core';

import { ThemeStore } from '@/shared/services/theme-store';

@Component({
  selector: 'theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  themeStore = inject(ThemeStore);
}
