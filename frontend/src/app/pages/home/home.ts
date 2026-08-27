import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppHeader } from "./components/app-header/app-header";
import { Hero } from "./components/hero/hero";
import { Features } from "./components/features/features";
import { Info } from "./components/info/info";
import { Confirm } from "./components/confirm/confirm";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, AppHeader, Hero, Features, Info, Confirm],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {}
