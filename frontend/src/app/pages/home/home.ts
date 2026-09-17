import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeader } from "./components/app-header/app-header";
import { Hero } from "./components/hero/hero";
import { Features } from "./components/features/features";
import { Info } from "./components/info/info";
import { Sobre } from "./components/sobre/sobre";
import { Confirm } from "./components/confirm/confirm";

// Obs.: o RouterLink saiu dos imports daqui — o home.html não usa routerLink
// (quem usa são os componentes filhos, e cada um agora importa o seu).
// Isso também elimina o aviso NG8113 que aparecia no build.
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AppHeader, Hero, Features, Info, Sobre, Confirm],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {}
