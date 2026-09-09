import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('teslo-shop');

  ngOnInit(): void {
    this.helloWorld();
  }

  protected helloWorld(): void {
    console.log('Hello World');
  }
}
