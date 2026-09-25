import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../../../../shared/icone';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Icone],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
  host: { '(keydown.escape)': 'fecharMenu()' },
})
export class AppHeader {
  // signal: o app é zoneless
  readonly menuAberto = signal(false);

  alternarMenu(): void {
    this.menuAberto.update(aberto => !aberto);
  }

  fecharMenu(): void {
    this.menuAberto.set(false);
  }
}
