import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FrontNavbar } from "../../components/front-navbar/front-navbar";

@Component({
  selector: 'app-strore-front-layout',
  imports: [RouterOutlet, FrontNavbar],
  templateUrl: './strore-front-layout.html',
})
export class StroreFrontLayout { }
