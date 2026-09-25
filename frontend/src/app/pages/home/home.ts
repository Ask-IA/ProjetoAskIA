import { Component } from '@angular/core';
import { AppHeader } from './components/app-header/app-header';
import { Hero } from './components/hero/hero';
import { Features } from './components/features/features';
import { Info } from './components/info/info';
import { Sobre } from './components/sobre/sobre';
import { Confirm } from './components/confirm/confirm';
import { AREAS, NOME_AREA, classeArea } from '../../core/areas';
import { Icone } from '../../shared/icone';

// Landing em fundo branco (24/09): sem Tailwind no template, sem Lucide por
// CDN e sem imagens externas. As cores vêm das mesmas variáveis do app.
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AppHeader, Hero, Features, Info, Sobre, Confirm, Icone],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  readonly areas = AREAS;
  readonly nomeArea = NOME_AREA;
  readonly classeArea = classeArea;
}
