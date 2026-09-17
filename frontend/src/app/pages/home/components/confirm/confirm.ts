import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-confirm',
  // Mesmo caso do Hero: o botão "Começar Agora" usa routerLink.
  imports: [RouterLink],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
})
export class Confirm {}
