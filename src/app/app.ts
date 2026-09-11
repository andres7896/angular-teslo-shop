import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeStore } from '@/shared/services/theme-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Se inyecta para garantizar que el tema se aplique desde el arranque,
  // aunque todavía no haya ningún `theme-toggle` montado.
  private themeStore = inject(ThemeStore);

  protected readonly title = signal('teslo-shop');

  ngOnInit(): void {
    this.helloWorld();
  }

  protected helloWorld(): void {
    console.log('Hello World');
  }
}
