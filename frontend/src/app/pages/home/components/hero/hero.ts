import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../../../../shared/icone';

@Component({
  selector: 'app-hero',
  // RouterLink PRECISA estar aqui: o template usa routerLink no botão
  // "Criar conta grátis". Sem este import, o Angular trata routerLink como
  // um atributo qualquer e o link não navega para lugar nenhum.
  imports: [RouterLink, Icone],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  // Números de exemplo da ilustração (não são dados de ninguém)
  readonly demoAreas = [
    { nome: 'Linguagens', classe: 'area-linguagens', valor: 62 },
    { nome: 'Humanas', classe: 'area-humanas', valor: 48 },
    { nome: 'Natureza', classe: 'area-natureza', valor: 35 },
    { nome: 'Matemática', classe: 'area-matematica', valor: 71 },
  ];
}
