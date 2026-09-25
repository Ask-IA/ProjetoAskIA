import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../../../../shared/icone';

@Component({
  selector: 'app-confirm',
  // Mesmo caso do Hero: o botão "Começar agora" usa routerLink.
  imports: [RouterLink, Icone],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
})
export class Confirm {}
